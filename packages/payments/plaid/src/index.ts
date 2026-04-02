#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const clientId = requireEnv("PLAID_CLIENT_ID");
const secret = requireEnv("PLAID_SECRET");
const env = process.env.PLAID_ENV || "sandbox";
const baseUrl = `https://${env}.plaid.com`;
const plaid = async (path: string, body: Record<string, unknown>) => {
  const res = await fetch(`${baseUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: clientId, secret, ...body }) });
  return res.json();
};
const server = createServer({ name: "@mcp-dev-usa/plaid", version: "1.0.0" });

server.tool("create_link_token", "Create a Plaid Link token", { user_id: z.string(), products: z.array(z.string()).default(["transactions"]) }, async ({ user_id, products }) => {
  try { return jsonResponse(await plaid("/link/token/create", { user: { client_user_id: user_id }, client_name: "MCP App", products, country_codes: ["US"], language: "en" })); } catch (e) { return errorResponse(e); }
});
server.tool("exchange_public_token", "Exchange public token for access token", { public_token: z.string() }, async ({ public_token }) => {
  try { return jsonResponse(await plaid("/item/public_token/exchange", { public_token })); } catch (e) { return errorResponse(e); }
});
server.tool("get_accounts", "Get accounts for an item", { access_token: z.string() }, async ({ access_token }) => {
  try { return jsonResponse(await plaid("/accounts/get", { access_token })); } catch (e) { return errorResponse(e); }
});
server.tool("get_transactions", "Get transactions", { access_token: z.string(), start_date: z.string(), end_date: z.string() }, async ({ access_token, start_date, end_date }) => {
  try { return jsonResponse(await plaid("/transactions/get", { access_token, start_date, end_date })); } catch (e) { return errorResponse(e); }
});
server.tool("get_balance", "Get real-time balances", { access_token: z.string() }, async ({ access_token }) => {
  try { return jsonResponse(await plaid("/accounts/balance/get", { access_token })); } catch (e) { return errorResponse(e); }
});
server.tool("get_identity", "Get account holder identity", { access_token: z.string() }, async ({ access_token }) => {
  try { return jsonResponse(await plaid("/identity/get", { access_token })); } catch (e) { return errorResponse(e); }
});
server.tool("get_auth", "Get routing/account numbers", { access_token: z.string() }, async ({ access_token }) => {
  try { return jsonResponse(await plaid("/auth/get", { access_token })); } catch (e) { return errorResponse(e); }
});
server.tool("get_institutions", "Search institutions", { query: z.string(), count: z.number().default(10) }, async ({ query, count }) => {
  try { return jsonResponse(await plaid("/institutions/search", { query, products: ["transactions"], country_codes: ["US"], options: { include_optional_metadata: true } })); } catch (e) { return errorResponse(e); }
});
server.tool("create_transfer", "Create an ACH transfer", { access_token: z.string(), account_id: z.string(), amount: z.string(), type: z.enum(["debit", "credit"]), network: z.string().default("ach") }, async ({ access_token, account_id, amount, type, network }) => {
  try { return jsonResponse(await plaid("/transfer/create", { access_token, account_id, amount, type, network, description: "MCP Transfer", idempotency_key: crypto.randomUUID() })); } catch (e) { return errorResponse(e); }
});
server.tool("get_item", "Get item status", { access_token: z.string() }, async ({ access_token }) => {
  try { return jsonResponse(await plaid("/item/get", { access_token })); } catch (e) { return errorResponse(e); }
});
startServer(server);
