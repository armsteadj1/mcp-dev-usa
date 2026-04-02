#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const apiKey = requireEnv("BT_API_KEY");
const baseUrl = "https://api.basistheory.com";
const bt = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, { method, headers: { "BT-API-KEY": apiKey, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const server = createServer({ name: "@mcp-dev-usa/basis-theory", version: "1.0.0" });

server.tool("tokenize", "Tokenize sensitive data (cards, SSNs, bank accounts) — PCI-compliant vault storage", { type: z.string().describe("Token type: card, social_security_number, bank, token"), data: z.record(z.unknown()).describe("Sensitive data to tokenize"), metadata: z.record(z.string()).optional() }, async ({ type, data, metadata }) => {
  try { return jsonResponse(await bt("POST", "/tokens", { type, data, metadata })); } catch (e) { return errorResponse(e); }
});

server.tool("get_token", "Retrieve a token by ID (returns masked data unless detokenize permissions)", { token_id: z.string() }, async ({ token_id }) => {
  try { return jsonResponse(await bt("GET", `/tokens/${token_id}`)); } catch (e) { return errorResponse(e); }
});

server.tool("search_tokens", "Search tokens by metadata or fingerprint", { query: z.string().describe("Lucene query string"), page: z.number().default(1), size: z.number().default(20) }, async ({ query, page, size }) => {
  try { return jsonResponse(await bt("POST", "/tokens/search", { query, page, size })); } catch (e) { return errorResponse(e); }
});

server.tool("delete_token", "Delete a token from the vault", { token_id: z.string() }, async ({ token_id }) => {
  try { await fetch(`${baseUrl}/tokens/${token_id}`, { method: "DELETE", headers: { "BT-API-KEY": apiKey } }); return jsonResponse({ deleted: true, id: token_id }); } catch (e) { return errorResponse(e); }
});

server.tool("proxy_request", "Forward an API call through BT's proxy — injects detokenized data into the request without your server touching it", { method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("POST"), url: z.string().describe("Destination API URL"), headers: z.record(z.string()).optional(), body: z.record(z.unknown()).optional() }, async ({ method, url, headers: hdrs, body }) => {
  try {
    const res = await fetch(`${baseUrl}/proxy`, { method, headers: { "BT-API-KEY": apiKey, "Content-Type": "application/json", "BT-PROXY-URL": url, ...(hdrs || {}) }, body: body ? JSON.stringify(body) : undefined });
    return jsonResponse(await res.json());
  } catch (e) { return errorResponse(e); }
});

server.tool("create_session", "Create a 3DS session for secure card authentication", { token_id: z.string().describe("Card token ID"), type: z.string().default("three_ds") }, async ({ token_id, type }) => {
  try { return jsonResponse(await bt("POST", "/3ds/sessions", { token_id, type })); } catch (e) { return errorResponse(e); }
});

server.tool("create_reactor", "Create a Reactor — serverless function that runs against tokenized data", { name: z.string(), code: z.string().describe("JavaScript code for the reactor"), configuration: z.record(z.string()).optional() }, async ({ name, code, configuration }) => {
  try { return jsonResponse(await bt("POST", "/reactors", { name, code, configuration })); } catch (e) { return errorResponse(e); }
});

server.tool("invoke_reactor", "Invoke a Reactor with arguments", { reactor_id: z.string(), args: z.record(z.unknown()) }, async ({ reactor_id, args }) => {
  try { return jsonResponse(await bt("POST", `/reactors/${reactor_id}/react`, { args })); } catch (e) { return errorResponse(e); }
});

server.tool("list_applications", "List API applications/keys", { page: z.number().default(1), size: z.number().default(20) }, async ({ page, size }) => {
  try { return jsonResponse(await bt("GET", `/applications?page=${page}&size=${size}`)); } catch (e) { return errorResponse(e); }
});

server.tool("create_application", "Create an API application with specific permissions", { name: z.string(), type: z.enum(["private", "public", "management"]), permissions: z.array(z.string()) }, async ({ name, type, permissions }) => {
  try { return jsonResponse(await bt("POST", "/applications", { name, type, permissions })); } catch (e) { return errorResponse(e); }
});

server.tool("tokenize_batch", "Tokenize multiple items in a single request", { tokens: z.array(z.object({ type: z.string(), data: z.record(z.unknown()), metadata: z.record(z.string()).optional() })) }, async ({ tokens }) => {
  try { return jsonResponse(await bt("POST", "/tokenize", tokens)); } catch (e) { return errorResponse(e); }
});

startServer(server);
