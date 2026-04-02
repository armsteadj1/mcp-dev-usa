#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const username = requireEnv("AVALARA_USERNAME");
const password = requireEnv("AVALARA_PASSWORD");
const companyCode = requireEnv("AVALARA_COMPANY_CODE");
const baseUrl = process.env.AVALARA_ENV === "production" ? "https://rest.avatax.com/api/v2" : "https://sandbox-rest.avatax.com/api/v2";
const auth = Buffer.from(`${username}:${password}`).toString("base64");
const av = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, { method, headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const server = createServer({ name: "@mcp-dev-usa/avalara", version: "1.0.0" });

server.tool("calculate_tax", "Calculate sales tax for a transaction", { lines: z.array(z.object({ amount: z.number(), quantity: z.number().default(1), taxCode: z.string().default("P0000000") })), ship_to: z.object({ line1: z.string(), city: z.string(), region: z.string(), postalCode: z.string(), country: z.string().default("US") }), customer_code: z.string() }, async ({ lines, ship_to, customer_code }) => {
  try { return jsonResponse(await av("POST", "/transactions/create", { type: "SalesInvoice", companyCode, date: new Date().toISOString().split("T")[0], customerCode: customer_code, addresses: { shipTo: ship_to }, lines: lines.map((l, i) => ({ number: `${i + 1}`, ...l })), commit: false })); } catch (e) { return errorResponse(e); }
});
server.tool("validate_address", "Validate and normalize a US address", { line1: z.string(), city: z.string().optional(), region: z.string().optional(), postalCode: z.string().optional(), country: z.string().default("US") }, async (addr) => {
  try { return jsonResponse(await av("POST", "/addresses/resolve", { ...addr })); } catch (e) { return errorResponse(e); }
});
server.tool("list_tax_codes", "List available tax codes", { filter: z.string().optional(), top: z.number().default(25) }, async ({ filter, top }) => {
  try { return jsonResponse(await av("GET", `/definitions/taxcodes?$top=${top}${filter ? `&$filter=${encodeURIComponent(filter)}` : ""}`)); } catch (e) { return errorResponse(e); }
});
server.tool("get_transaction", "Get transaction details", { transaction_code: z.string() }, async ({ transaction_code }) => {
  try { return jsonResponse(await av("GET", `/companies/${companyCode}/transactions/${transaction_code}`)); } catch (e) { return errorResponse(e); }
});
server.tool("void_transaction", "Void a transaction", { transaction_code: z.string(), reason: z.string().default("DocVoided") }, async ({ transaction_code, reason }) => {
  try { return jsonResponse(await av("POST", `/companies/${companyCode}/transactions/${transaction_code}/void`, { code: reason })); } catch (e) { return errorResponse(e); }
});
server.tool("create_exemption", "Create a tax exemption certificate", { customer_code: z.string(), exempt_reason: z.string(), region: z.string() }, async ({ customer_code, exempt_reason, region }) => {
  try { return jsonResponse(await av("POST", `/companies/${companyCode}/customers/${customer_code}/certificates`, { exemptionReason: exempt_reason, region })); } catch (e) { return errorResponse(e); }
});
server.tool("list_nexus", "List tax nexus declarations", {}, async () => {
  try { return jsonResponse(await av("GET", `/companies/${companyCode}/nexus`)); } catch (e) { return errorResponse(e); }
});
server.tool("get_tax_rate", "Get tax rate by postal code", { postal_code: z.string(), country: z.string().default("US") }, async ({ postal_code, country }) => {
  try { return jsonResponse(await av("GET", `/taxrates/bypostalcode?country=${country}&postalCode=${postal_code}`)); } catch (e) { return errorResponse(e); }
});
startServer(server);
