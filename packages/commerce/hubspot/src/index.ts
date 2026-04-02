#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const accessToken = requireEnv("HUBSPOT_ACCESS_TOKEN");
const baseUrl = "https://api.hubapi.com";
const hs = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, { method, headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const server = createServer({ name: "@mcp-dev-usa/hubspot", version: "1.0.0" });

server.tool("list_contacts", "List CRM contacts", { limit: z.number().default(10), after: z.string().optional() }, async ({ limit, after }) => {
  try { return jsonResponse(await hs("GET", `/crm/v3/objects/contacts?limit=${limit}${after ? `&after=${after}` : ""}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_contact", "Create a contact", { email: z.string(), firstname: z.string().optional(), lastname: z.string().optional(), phone: z.string().optional() }, async ({ email, firstname, lastname, phone }) => {
  try { return jsonResponse(await hs("POST", "/crm/v3/objects/contacts", { properties: { email, firstname, lastname, phone } })); } catch (e) { return errorResponse(e); }
});
server.tool("list_deals", "List deals", { limit: z.number().default(10), after: z.string().optional() }, async ({ limit, after }) => {
  try { return jsonResponse(await hs("GET", `/crm/v3/objects/deals?limit=${limit}${after ? `&after=${after}` : ""}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_deal", "Create a deal", { dealname: z.string(), amount: z.string().optional(), pipeline: z.string().optional(), dealstage: z.string().optional() }, async ({ dealname, amount, pipeline, dealstage }) => {
  try { return jsonResponse(await hs("POST", "/crm/v3/objects/deals", { properties: { dealname, amount, pipeline, dealstage } })); } catch (e) { return errorResponse(e); }
});
server.tool("list_companies", "List companies", { limit: z.number().default(10) }, async ({ limit }) => {
  try { return jsonResponse(await hs("GET", `/crm/v3/objects/companies?limit=${limit}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_company", "Create a company", { name: z.string(), domain: z.string().optional(), industry: z.string().optional() }, async ({ name, domain, industry }) => {
  try { return jsonResponse(await hs("POST", "/crm/v3/objects/companies", { properties: { name, domain, industry } })); } catch (e) { return errorResponse(e); }
});
server.tool("search_contacts", "Search contacts", { query: z.string(), limit: z.number().default(10) }, async ({ query, limit }) => {
  try { return jsonResponse(await hs("POST", "/crm/v3/objects/contacts/search", { query, limit })); } catch (e) { return errorResponse(e); }
});
server.tool("list_pipelines", "List deal pipelines", {}, async () => {
  try { return jsonResponse(await hs("GET", "/crm/v3/pipelines/deals")); } catch (e) { return errorResponse(e); }
});
server.tool("create_note", "Create a note on a contact", { contact_id: z.string(), body: z.string() }, async ({ contact_id, body }) => {
  try {
    const note = await hs("POST", "/crm/v3/objects/notes", { properties: { hs_note_body: body, hs_timestamp: new Date().toISOString() } }) as { id: string };
    await hs("PUT", `/crm/v3/objects/notes/${note.id}/associations/contacts/${contact_id}/note_to_contact`, {});
    return jsonResponse(note);
  } catch (e) { return errorResponse(e); }
});
server.tool("get_deal", "Get deal details", { deal_id: z.string() }, async ({ deal_id }) => {
  try { return jsonResponse(await hs("GET", `/crm/v3/objects/deals/${deal_id}`)); } catch (e) { return errorResponse(e); }
});
startServer(server);
