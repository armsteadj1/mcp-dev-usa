#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const apiKey = requireEnv("COLUMN_API_KEY");
const baseUrl = "https://api.column.com";
const col = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, { method, headers: { "Authorization": `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const server = createServer({ name: "@mcp-dev-usa/column", version: "1.0.0" });

server.tool("list_bank_accounts", "List bank accounts", { limit: z.number().default(25) }, async ({ limit }) => {
  try { return jsonResponse(await col("GET", `/bank-accounts?limit=${limit}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_bank_account", "Create a bank account", { entity_id: z.string(), description: z.string().optional() }, async (params) => {
  try { return jsonResponse(await col("POST", "/bank-accounts", params)); } catch (e) { return errorResponse(e); }
});
server.tool("create_ach_transfer", "Create an ACH transfer", { amount: z.number(), currency_code: z.string().default("USD"), originating_account_id: z.string(), receiving_account_id: z.string(), type: z.enum(["debit", "credit"]) }, async (params) => {
  try { return jsonResponse(await col("POST", "/transfers/ach", params)); } catch (e) { return errorResponse(e); }
});
server.tool("create_wire_transfer", "Create a wire transfer", { amount: z.number(), currency_code: z.string().default("USD"), originating_account_id: z.string(), receiving_account_id: z.string(), description: z.string().optional() }, async (params) => {
  try { return jsonResponse(await col("POST", "/transfers/wire", params)); } catch (e) { return errorResponse(e); }
});
server.tool("create_book_transfer", "Create a book transfer", { amount: z.number(), currency_code: z.string().default("USD"), sender_bank_account_id: z.string(), receiver_bank_account_id: z.string() }, async (params) => {
  try { return jsonResponse(await col("POST", "/transfers/book", params)); } catch (e) { return errorResponse(e); }
});
server.tool("list_entities", "List entities", { limit: z.number().default(25) }, async ({ limit }) => {
  try { return jsonResponse(await col("GET", `/entities?limit=${limit}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_entity", "Create a person or business entity", { type: z.enum(["person", "business"]), person: z.object({ first_name: z.string(), last_name: z.string(), email: z.string() }).optional(), business: z.object({ legal_name: z.string(), ein: z.string() }).optional() }, async (params) => {
  try { return jsonResponse(await col("POST", "/entities", params)); } catch (e) { return errorResponse(e); }
});
server.tool("list_transactions", "List transactions", { bank_account_id: z.string().optional(), limit: z.number().default(25) }, async ({ bank_account_id, limit }) => {
  try { return jsonResponse(await col("GET", `/transactions?limit=${limit}${bank_account_id ? `&bank_account_id=${bank_account_id}` : ""}`)); } catch (e) { return errorResponse(e); }
});
startServer(server);
