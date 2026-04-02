#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const serverToken = requireEnv("POSTMARK_SERVER_TOKEN");
const baseUrl = "https://api.postmarkapp.com";
const pm = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, { method, headers: { "X-Postmark-Server-Token": serverToken, "Content-Type": "application/json", "Accept": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const server = createServer({ name: "@mcp-dev-usa/postmark", version: "1.0.0" });

server.tool("send_email", "Send an email", { from: z.string(), to: z.string(), subject: z.string(), text_body: z.string().optional(), html_body: z.string().optional() }, async ({ from, to, subject, text_body, html_body }) => {
  try { return jsonResponse(await pm("POST", "/email", { From: from, To: to, Subject: subject, TextBody: text_body, HtmlBody: html_body })); } catch (e) { return errorResponse(e); }
});
server.tool("send_template", "Send using a template", { from: z.string(), to: z.string(), template_id: z.number(), template_model: z.record(z.unknown()) }, async ({ from, to, template_id, template_model }) => {
  try { return jsonResponse(await pm("POST", "/email/withTemplate", { From: from, To: to, TemplateId: template_id, TemplateModel: template_model })); } catch (e) { return errorResponse(e); }
});
server.tool("list_templates", "List email templates", { count: z.number().default(25), offset: z.number().default(0) }, async ({ count, offset }) => {
  try { return jsonResponse(await pm("GET", `/templates?Count=${count}&Offset=${offset}`)); } catch (e) { return errorResponse(e); }
});
server.tool("get_delivery_stats", "Get delivery statistics", {}, async () => {
  try { return jsonResponse(await pm("GET", "/deliverystats")); } catch (e) { return errorResponse(e); }
});
server.tool("search_outbound", "Search outbound messages", { count: z.number().default(25), offset: z.number().default(0), recipient: z.string().optional(), tag: z.string().optional() }, async ({ count, offset, recipient, tag }) => {
  try { return jsonResponse(await pm("GET", `/messages/outbound?count=${count}&offset=${offset}${recipient ? `&recipient=${recipient}` : ""}${tag ? `&tag=${tag}` : ""}`)); } catch (e) { return errorResponse(e); }
});
server.tool("get_bounces", "List bounced messages", { count: z.number().default(25), offset: z.number().default(0) }, async ({ count, offset }) => {
  try { return jsonResponse(await pm("GET", `/bounces?count=${count}&offset=${offset}`)); } catch (e) { return errorResponse(e); }
});
server.tool("get_server_info", "Get server information", {}, async () => {
  try { return jsonResponse(await pm("GET", "/server")); } catch (e) { return errorResponse(e); }
});
server.tool("send_batch", "Send batch emails", { messages: z.array(z.object({ from: z.string(), to: z.string(), subject: z.string(), text_body: z.string().optional(), html_body: z.string().optional() })) }, async ({ messages }) => {
  try { return jsonResponse(await pm("POST", "/email/batch", messages.map(m => ({ From: m.from, To: m.to, Subject: m.subject, TextBody: m.text_body, HtmlBody: m.html_body })))); } catch (e) { return errorResponse(e); }
});
startServer(server);
