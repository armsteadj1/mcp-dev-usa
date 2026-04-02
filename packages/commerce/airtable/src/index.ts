#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const apiKey = requireEnv("AIRTABLE_API_KEY");
const baseUrl = "https://api.airtable.com/v0";
const at = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, { method, headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const server = createServer({ name: "@mcp-dev-usa/airtable", version: "1.0.0" });

server.tool("list_bases", "List accessible bases", {}, async () => {
  try { return jsonResponse(await at("GET", "https://api.airtable.com/v0/meta/bases".replace(baseUrl, ""))); } catch (e) { return errorResponse(e); }
});
server.tool("list_records", "List records from a table", { base_id: z.string(), table_name: z.string(), max_records: z.number().default(100), view: z.string().optional() }, async ({ base_id, table_name, max_records, view }) => {
  try { return jsonResponse(await at("GET", `/${base_id}/${encodeURIComponent(table_name)}?maxRecords=${max_records}${view ? `&view=${encodeURIComponent(view)}` : ""}`)); } catch (e) { return errorResponse(e); }
});
server.tool("get_record", "Get a specific record", { base_id: z.string(), table_name: z.string(), record_id: z.string() }, async ({ base_id, table_name, record_id }) => {
  try { return jsonResponse(await at("GET", `/${base_id}/${encodeURIComponent(table_name)}/${record_id}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_records", "Create records", { base_id: z.string(), table_name: z.string(), records: z.array(z.object({ fields: z.record(z.unknown()) })) }, async ({ base_id, table_name, records }) => {
  try { return jsonResponse(await at("POST", `/${base_id}/${encodeURIComponent(table_name)}`, { records })); } catch (e) { return errorResponse(e); }
});
server.tool("update_records", "Update records", { base_id: z.string(), table_name: z.string(), records: z.array(z.object({ id: z.string(), fields: z.record(z.unknown()) })) }, async ({ base_id, table_name, records }) => {
  try { return jsonResponse(await at("PATCH", `/${base_id}/${encodeURIComponent(table_name)}`, { records })); } catch (e) { return errorResponse(e); }
});
server.tool("delete_records", "Delete records", { base_id: z.string(), table_name: z.string(), record_ids: z.array(z.string()) }, async ({ base_id, table_name, record_ids }) => {
  try { return jsonResponse(await at("DELETE", `/${base_id}/${encodeURIComponent(table_name)}?${record_ids.map(id => `records[]=${id}`).join("&")}`)); } catch (e) { return errorResponse(e); }
});
server.tool("list_tables", "List tables in a base", { base_id: z.string() }, async ({ base_id }) => {
  try { const res = await fetch(`https://api.airtable.com/v0/meta/bases/${base_id}/tables`, { headers: { "Authorization": `Bearer ${apiKey}` } }); return jsonResponse(await res.json()); } catch (e) { return errorResponse(e); }
});
server.tool("search_records", "Search records with a formula", { base_id: z.string(), table_name: z.string(), formula: z.string().describe("Airtable formula filter"), max_records: z.number().default(100) }, async ({ base_id, table_name, formula, max_records }) => {
  try { return jsonResponse(await at("GET", `/${base_id}/${encodeURIComponent(table_name)}?maxRecords=${max_records}&filterByFormula=${encodeURIComponent(formula)}`)); } catch (e) { return errorResponse(e); }
});
startServer(server);
