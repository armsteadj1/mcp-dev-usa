#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const apiKey = requireEnv("INCREASE_API_KEY");
const baseUrl = process.env.INCREASE_ENV === "production" ? "https://api.increase.com" : "https://sandbox.increase.com";
const inc = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, { method, headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const server = createServer({ name: "@mcp-dev-usa/increase", version: "1.0.0" });

server.tool("list_accounts", "List accounts", { limit: z.number().default(25) }, async ({ limit }) => {
  try { return jsonResponse(await inc("GET", `/accounts?limit=${limit}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_account", "Create an account", { name: z.string(), entity_id: z.string().optional(), program_id: z.string() }, async (params) => {
  try { return jsonResponse(await inc("POST", "/accounts", params)); } catch (e) { return errorResponse(e); }
});
server.tool("create_ach_transfer", "Create an ACH transfer", { account_id: z.string(), amount: z.number(), routing_number: z.string(), account_number: z.string(), statement_descriptor: z.string() }, async (params) => {
  try { return jsonResponse(await inc("POST", "/ach_transfers", params)); } catch (e) { return errorResponse(e); }
});
server.tool("create_wire_transfer", "Create a wire transfer", { account_id: z.string(), amount: z.number(), routing_number: z.string(), account_number: z.string(), beneficiary_name: z.string(), message_to_recipient: z.string().optional() }, async (params) => {
  try { return jsonResponse(await inc("POST", "/wire_transfers", params)); } catch (e) { return errorResponse(e); }
});
server.tool("create_check_transfer", "Create a check transfer", { account_id: z.string(), amount: z.number(), source_account_number_id: z.string(), fulfillment_method: z.string().default("physical_check"), physical_check: z.object({ recipient_name: z.string(), mailing_address: z.object({ name: z.string(), line1: z.string(), city: z.string(), state: z.string(), postal_code: z.string() }), memo: z.string().optional() }) }, async (params) => {
  try { return jsonResponse(await inc("POST", "/check_transfers", params)); } catch (e) { return errorResponse(e); }
});
server.tool("list_transactions", "List transactions", { account_id: z.string().optional(), limit: z.number().default(25) }, async ({ account_id, limit }) => {
  try { return jsonResponse(await inc("GET", `/transactions?limit=${limit}${account_id ? `&account_id=${account_id}` : ""}`)); } catch (e) { return errorResponse(e); }
});
server.tool("get_balance", "Get account balances", { account_id: z.string() }, async ({ account_id }) => {
  try { return jsonResponse(await inc("GET", `/accounts/${account_id}`)); } catch (e) { return errorResponse(e); }
});
server.tool("list_entities", "List entities", { limit: z.number().default(25) }, async ({ limit }) => {
  try { return jsonResponse(await inc("GET", `/entities?limit=${limit}`)); } catch (e) { return errorResponse(e); }
});
startServer(server);
