#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const accessToken = requireEnv("SQUARE_ACCESS_TOKEN");
const baseUrl = process.env.SQUARE_ENVIRONMENT === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
const headers = { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json", "Square-Version": "2024-01-18" };
const sq = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const server = createServer({ name: "@mcp-dev-usa/square", version: "1.0.0" });

server.tool("create_payment", "Create a Square payment", { source_id: z.string(), amount: z.number().describe("Amount in cents"), currency: z.string().default("USD") }, async ({ source_id, amount, currency }) => {
  try { return jsonResponse(await sq("POST", "/v2/payments", { source_id, amount_money: { amount, currency }, idempotency_key: crypto.randomUUID() })); } catch (e) { return errorResponse(e); }
});
server.tool("list_payments", "List recent payments", { limit: z.number().default(10) }, async ({ limit }) => {
  try { return jsonResponse(await sq("GET", `/v2/payments?limit=${limit}`)); } catch (e) { return errorResponse(e); }
});
server.tool("list_customers", "List Square customers", { limit: z.number().default(10) }, async ({ limit }) => {
  try { return jsonResponse(await sq("GET", `/v2/customers?limit=${limit}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_customer", "Create a Square customer", { given_name: z.string(), family_name: z.string().optional(), email: z.string().optional() }, async ({ given_name, family_name, email }) => {
  try { return jsonResponse(await sq("POST", "/v2/customers", { given_name, family_name, email_address: email })); } catch (e) { return errorResponse(e); }
});
server.tool("list_catalog", "List catalog items", { types: z.string().default("ITEM") }, async ({ types }) => {
  try { return jsonResponse(await sq("GET", `/v2/catalog/list?types=${types}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_order", "Create a Square order", { location_id: z.string(), line_items: z.array(z.object({ name: z.string(), quantity: z.string(), base_price_money: z.object({ amount: z.number(), currency: z.string().default("USD") }) })) }, async ({ location_id, line_items }) => {
  try { return jsonResponse(await sq("POST", "/v2/orders", { order: { location_id, line_items }, idempotency_key: crypto.randomUUID() })); } catch (e) { return errorResponse(e); }
});
server.tool("list_locations", "List business locations", {}, async () => {
  try { return jsonResponse(await sq("GET", "/v2/locations")); } catch (e) { return errorResponse(e); }
});
server.tool("create_invoice", "Create a Square invoice", { location_id: z.string(), order_id: z.string(), customer_id: z.string() }, async ({ location_id, order_id, customer_id }) => {
  try { return jsonResponse(await sq("POST", "/v2/invoices", { invoice: { location_id, order_id, primary_recipient: { customer_id }, payment_requests: [{ request_type: "BALANCE" }] }, idempotency_key: crypto.randomUUID() })); } catch (e) { return errorResponse(e); }
});
server.tool("list_inventory", "Get inventory counts", { location_ids: z.array(z.string()) }, async ({ location_ids }) => {
  try { return jsonResponse(await sq("POST", "/v2/inventory/batch-retrieve-counts", { location_ids })); } catch (e) { return errorResponse(e); }
});
server.tool("create_refund", "Refund a payment", { payment_id: z.string(), amount: z.number(), currency: z.string().default("USD") }, async ({ payment_id, amount, currency }) => {
  try { return jsonResponse(await sq("POST", "/v2/refunds", { payment_id, amount_money: { amount, currency }, idempotency_key: crypto.randomUUID() })); } catch (e) { return errorResponse(e); }
});
startServer(server);
