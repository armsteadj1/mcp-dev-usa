#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const apiKey = requireEnv("SENDGRID_API_KEY");
const baseUrl = "https://api.sendgrid.com/v3";
const sg = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, { method, headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return text ? JSON.parse(text) : { status: res.status };
};
const server = createServer({ name: "@mcp-dev-usa/sendgrid", version: "1.0.0" });

server.tool("send_email", "Send an email", { to: z.string(), from: z.string(), subject: z.string(), text: z.string().optional(), html: z.string().optional() }, async ({ to, from, subject, text, html }) => {
  try { return jsonResponse(await sg("POST", "/mail/send", { personalizations: [{ to: [{ email: to }] }], from: { email: from }, subject, content: [{ type: html ? "text/html" : "text/plain", value: html || text || "" }] })); } catch (e) { return errorResponse(e); }
});
server.tool("list_contacts", "List marketing contacts", { page_size: z.number().default(50) }, async ({ page_size }) => {
  try { return jsonResponse(await sg("GET", `/marketing/contacts?page_size=${page_size}`)); } catch (e) { return errorResponse(e); }
});
server.tool("add_contacts", "Add/update marketing contacts", { contacts: z.array(z.object({ email: z.string(), first_name: z.string().optional(), last_name: z.string().optional() })) }, async ({ contacts }) => {
  try { return jsonResponse(await sg("PUT", "/marketing/contacts", { contacts })); } catch (e) { return errorResponse(e); }
});
server.tool("list_templates", "List email templates", { generations: z.string().default("dynamic") }, async ({ generations }) => {
  try { return jsonResponse(await sg("GET", `/templates?generations=${generations}`)); } catch (e) { return errorResponse(e); }
});
server.tool("send_template", "Send email using a template", { to: z.string(), from: z.string(), template_id: z.string(), dynamic_data: z.record(z.unknown()).optional() }, async ({ to, from, template_id, dynamic_data }) => {
  try { return jsonResponse(await sg("POST", "/mail/send", { personalizations: [{ to: [{ email: to }], dynamic_template_data: dynamic_data }], from: { email: from }, template_id })); } catch (e) { return errorResponse(e); }
});
server.tool("get_stats", "Get email stats", { start_date: z.string(), end_date: z.string().optional() }, async ({ start_date, end_date }) => {
  try { return jsonResponse(await sg("GET", `/stats?start_date=${start_date}${end_date ? `&end_date=${end_date}` : ""}`)); } catch (e) { return errorResponse(e); }
});
server.tool("list_lists", "List contact lists", { page_size: z.number().default(25) }, async ({ page_size }) => {
  try { return jsonResponse(await sg("GET", `/marketing/lists?page_size=${page_size}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_list", "Create a contact list", { name: z.string() }, async ({ name }) => {
  try { return jsonResponse(await sg("POST", "/marketing/lists", { name })); } catch (e) { return errorResponse(e); }
});
server.tool("validate_email", "Validate an email address", { email: z.string() }, async ({ email }) => {
  try { return jsonResponse(await sg("POST", "/validations/email", { email })); } catch (e) { return errorResponse(e); }
});
server.tool("get_bounces", "Get bounced emails", { limit: z.number().default(25) }, async ({ limit }) => {
  try { return jsonResponse(await sg("GET", `/suppression/bounces?limit=${limit}`)); } catch (e) { return errorResponse(e); }
});
startServer(server);
