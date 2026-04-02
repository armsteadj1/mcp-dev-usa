#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const clientId = requireEnv("PAYPAL_CLIENT_ID");
const clientSecret = requireEnv("PAYPAL_CLIENT_SECRET");
const baseUrl = process.env.PAYPAL_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

let cachedToken: { token: string; expires: number } | null = null;
const getToken = async () => {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token;
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, { method: "POST", headers: { "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
};
const pp = async (method: string, path: string, body?: unknown) => {
  const token = await getToken();
  const res = await fetch(`${baseUrl}${path}`, { method, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const server = createServer({ name: "@mcp-dev-usa/paypal", version: "1.0.0" });

server.tool("create_order", "Create a PayPal order", { amount: z.string(), currency: z.string().default("USD"), description: z.string().optional() }, async ({ amount, currency, description }) => {
  try { return jsonResponse(await pp("POST", "/v2/checkout/orders", { intent: "CAPTURE", purchase_units: [{ amount: { currency_code: currency, value: amount }, description }] })); } catch (e) { return errorResponse(e); }
});
server.tool("capture_order", "Capture an approved order", { order_id: z.string() }, async ({ order_id }) => {
  try { return jsonResponse(await pp("POST", `/v2/checkout/orders/${order_id}/capture`)); } catch (e) { return errorResponse(e); }
});
server.tool("get_order", "Get order details", { order_id: z.string() }, async ({ order_id }) => {
  try { return jsonResponse(await pp("GET", `/v2/checkout/orders/${order_id}`)); } catch (e) { return errorResponse(e); }
});
server.tool("list_transactions", "List transactions", { start_date: z.string(), end_date: z.string() }, async ({ start_date, end_date }) => {
  try { return jsonResponse(await pp("GET", `/v1/reporting/transactions?start_date=${start_date}&end_date=${end_date}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_payout", "Send a batch payout", { items: z.array(z.object({ email: z.string(), amount: z.string(), currency: z.string().default("USD") })) }, async ({ items }) => {
  try { return jsonResponse(await pp("POST", "/v1/payments/payouts", { sender_batch_header: { sender_batch_id: crypto.randomUUID(), email_subject: "Payment" }, items: items.map(i => ({ recipient_type: "EMAIL", amount: { value: i.amount, currency: i.currency }, receiver: i.email })) })); } catch (e) { return errorResponse(e); }
});
server.tool("refund_capture", "Refund a captured payment", { capture_id: z.string(), amount: z.string().optional(), currency: z.string().default("USD") }, async ({ capture_id, amount, currency }) => {
  try { return jsonResponse(await pp("POST", `/v2/payments/captures/${capture_id}/refund`, amount ? { amount: { value: amount, currency_code: currency } } : {})); } catch (e) { return errorResponse(e); }
});
server.tool("create_subscription", "Create a subscription", { plan_id: z.string(), subscriber_email: z.string() }, async ({ plan_id, subscriber_email }) => {
  try { return jsonResponse(await pp("POST", "/v1/billing/subscriptions", { plan_id, subscriber: { email_address: subscriber_email }, application_context: { return_url: "https://example.com/return", cancel_url: "https://example.com/cancel" } })); } catch (e) { return errorResponse(e); }
});
server.tool("list_disputes", "List payment disputes", { status: z.string().optional() }, async ({ status }) => {
  try { return jsonResponse(await pp("GET", `/v1/customer/disputes${status ? `?dispute_state=${status}` : ""}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_invoice", "Create a draft invoice", { recipient_email: z.string(), items: z.array(z.object({ name: z.string(), quantity: z.string(), unit_amount: z.string(), currency: z.string().default("USD") })) }, async ({ recipient_email, items }) => {
  try { return jsonResponse(await pp("POST", "/v2/invoicing/invoices", { detail: { currency_code: items[0]?.currency || "USD" }, primary_recipients: [{ billing_info: { email_address: recipient_email } }], items: items.map(i => ({ name: i.name, quantity: i.quantity, unit_amount: { currency_code: i.currency, value: i.unit_amount } })) })); } catch (e) { return errorResponse(e); }
});
server.tool("get_balance", "Get PayPal account balance", {}, async () => {
  try { return jsonResponse(await pp("GET", "/v1/reporting/balances")); } catch (e) { return errorResponse(e); }
});
startServer(server);
