#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";
import Stripe from "stripe";

const apiKey = requireEnv("STRIPE_API_KEY");
const stripe = new Stripe(apiKey);
const server = createServer({ name: "@mcp-dev-usa/stripe", version: "1.0.0" });

server.tool("create_payment_intent", "Create a Stripe payment intent", { amount: z.number().describe("Amount in cents"), currency: z.string().default("usd"), description: z.string().optional() }, async ({ amount, currency, description }) => {
  try { return jsonResponse(await stripe.paymentIntents.create({ amount, currency, description: description ?? undefined })); } catch (e) { return errorResponse(e); }
});

server.tool("list_customers", "List Stripe customers", { limit: z.number().default(10), starting_after: z.string().optional() }, async ({ limit, starting_after }) => {
  try { return jsonResponse(await stripe.customers.list({ limit, starting_after: starting_after ?? undefined })); } catch (e) { return errorResponse(e); }
});

server.tool("create_customer", "Create a Stripe customer", { email: z.string(), name: z.string().optional(), description: z.string().optional() }, async ({ email, name, description }) => {
  try { return jsonResponse(await stripe.customers.create({ email, name: name ?? undefined, description: description ?? undefined })); } catch (e) { return errorResponse(e); }
});

server.tool("create_subscription", "Create a subscription", { customer: z.string(), price: z.string() }, async ({ customer, price }) => {
  try { return jsonResponse(await stripe.subscriptions.create({ customer, items: [{ price }] })); } catch (e) { return errorResponse(e); }
});

server.tool("list_charges", "List recent charges", { limit: z.number().default(10) }, async ({ limit }) => {
  try { return jsonResponse(await stripe.charges.list({ limit })); } catch (e) { return errorResponse(e); }
});

server.tool("create_refund", "Refund a charge", { charge: z.string(), amount: z.number().optional() }, async ({ charge, amount }) => {
  try { return jsonResponse(await stripe.refunds.create({ charge, amount: amount ?? undefined })); } catch (e) { return errorResponse(e); }
});

server.tool("get_balance", "Get Stripe account balance", {}, async () => {
  try { return jsonResponse(await stripe.balance.retrieve()); } catch (e) { return errorResponse(e); }
});

server.tool("list_payment_methods", "List payment methods for a customer", { customer: z.string(), type: z.string().default("card") }, async ({ customer, type }) => {
  try { return jsonResponse(await stripe.paymentMethods.list({ customer, type: type as Stripe.PaymentMethodListParams.Type })); } catch (e) { return errorResponse(e); }
});

server.tool("create_checkout_session", "Create a checkout session", { line_items: z.array(z.object({ price: z.string(), quantity: z.number() })), success_url: z.string(), cancel_url: z.string() }, async ({ line_items, success_url, cancel_url }) => {
  try { return jsonResponse(await stripe.checkout.sessions.create({ line_items, mode: "payment", success_url, cancel_url })); } catch (e) { return errorResponse(e); }
});

server.tool("create_invoice", "Create and finalize an invoice", { customer: z.string(), description: z.string().optional() }, async ({ customer, description }) => {
  try {
    const invoice = await stripe.invoices.create({ customer, description: description ?? undefined });
    return jsonResponse(invoice);
  } catch (e) { return errorResponse(e); }
});

startServer(server);
