#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const apiKey = requireEnv("MERCURY_API_KEY");
const baseUrl = "https://api.mercury.com/api/v1";
const mc = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, { method, headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const server = createServer({ name: "@mcp-dev-usa/mercury", version: "1.0.0" });

server.tool("list_accounts", "List Mercury accounts", {}, async () => {
  try { return jsonResponse(await mc("GET", "/accounts")); } catch (e) { return errorResponse(e); }
});
server.tool("get_account", "Get account details", { account_id: z.string() }, async ({ account_id }) => {
  try { return jsonResponse(await mc("GET", `/account/${account_id}`)); } catch (e) { return errorResponse(e); }
});
server.tool("list_transactions", "List transactions", { account_id: z.string(), limit: z.number().default(25), offset: z.number().default(0) }, async ({ account_id, limit, offset }) => {
  try { return jsonResponse(await mc("GET", `/account/${account_id}/transactions?limit=${limit}&offset=${offset}`)); } catch (e) { return errorResponse(e); }
});
server.tool("list_recipients", "List payment recipients", {}, async () => {
  try { return jsonResponse(await mc("GET", "/recipients")); } catch (e) { return errorResponse(e); }
});
server.tool("create_recipient", "Create a payment recipient", { name: z.string(), email: z.string().optional(), payment_method: z.enum(["ach", "wire", "check"]).default("ach"), routing_number: z.string().optional(), account_number: z.string().optional() }, async (params) => {
  try { return jsonResponse(await mc("POST", "/recipients", params)); } catch (e) { return errorResponse(e); }
});
server.tool("send_payment", "Send a payment", { account_id: z.string(), recipient_id: z.string(), amount: z.number(), payment_method: z.string().default("ach"), note: z.string().optional() }, async ({ account_id, ...rest }) => {
  try { return jsonResponse(await mc("POST", `/account/${account_id}/transactions`, rest)); } catch (e) { return errorResponse(e); }
});
server.tool("get_transaction", "Get transaction details", { account_id: z.string(), transaction_id: z.string() }, async ({ account_id, transaction_id }) => {
  try { return jsonResponse(await mc("GET", `/account/${account_id}/transaction/${transaction_id}`)); } catch (e) { return errorResponse(e); }
});
server.tool("get_statement", "Get account statement", { account_id: z.string(), month: z.string().describe("YYYY-MM") }, async ({ account_id, month }) => {
  try { return jsonResponse(await mc("GET", `/account/${account_id}/statement?month=${month}`)); } catch (e) { return errorResponse(e); }
});
startServer(server);
