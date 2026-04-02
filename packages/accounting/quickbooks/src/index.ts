#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const accessToken = requireEnv("QB_ACCESS_TOKEN");
const realmId = requireEnv("QB_REALM_ID");
const baseUrl = process.env.QB_SANDBOX === "true"
  ? `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}`
  : `https://quickbooks.api.intuit.com/v3/company/${realmId}`;

async function qbFetch(path: string, method = "GET", body?: unknown): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`QuickBooks API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function qbQuery(query: string): Promise<unknown> {
  return qbFetch(`/query?query=${encodeURIComponent(query)}`);
}

const server = createServer({ name: "@mcp-dev-usa/quickbooks", version: "1.0.0" });

server.tool("list_invoices", "List QuickBooks invoices", { limit: z.number().default(10) }, async ({ limit }) => {
  try { return jsonResponse(await qbQuery(`SELECT * FROM Invoice MAXRESULTS ${limit}`)); } catch (e) { return errorResponse(e); }
});

server.tool("create_invoice", "Create a QuickBooks invoice", { customer_id: z.string(), line_amount: z.number(), line_description: z.string().default("Service") }, async ({ customer_id, line_amount, line_description }) => {
  try { return jsonResponse(await qbFetch("/invoice", "POST", { CustomerRef: { value: customer_id }, Line: [{ Amount: line_amount, DetailType: "SalesItemLineDetail", Description: line_description, SalesItemLineDetail: { ItemRef: { value: "1" } } }] })); } catch (e) { return errorResponse(e); }
});

server.tool("list_customers", "List QuickBooks customers", { limit: z.number().default(10) }, async ({ limit }) => {
  try { return jsonResponse(await qbQuery(`SELECT * FROM Customer MAXRESULTS ${limit}`)); } catch (e) { return errorResponse(e); }
});

server.tool("create_customer", "Create a QuickBooks customer", { display_name: z.string(), email: z.string().optional() }, async ({ display_name, email }) => {
  try {
    const body: Record<string, unknown> = { DisplayName: display_name };
    if (email) body.PrimaryEmailAddr = { Address: email };
    return jsonResponse(await qbFetch("/customer", "POST", body));
  } catch (e) { return errorResponse(e); }
});

server.tool("get_company_info", "Get company info", {}, async () => {
  try { return jsonResponse(await qbFetch(`/companyinfo/${realmId}`)); } catch (e) { return errorResponse(e); }
});

server.tool("list_accounts", "List chart of accounts", { limit: z.number().default(20) }, async ({ limit }) => {
  try { return jsonResponse(await qbQuery(`SELECT * FROM Account MAXRESULTS ${limit}`)); } catch (e) { return errorResponse(e); }
});

server.tool("create_payment", "Record a payment", { customer_id: z.string(), amount: z.number() }, async ({ customer_id, amount }) => {
  try { return jsonResponse(await qbFetch("/payment", "POST", { CustomerRef: { value: customer_id }, TotalAmt: amount })); } catch (e) { return errorResponse(e); }
});

server.tool("list_items", "List products/services", { limit: z.number().default(20) }, async ({ limit }) => {
  try { return jsonResponse(await qbQuery(`SELECT * FROM Item MAXRESULTS ${limit}`)); } catch (e) { return errorResponse(e); }
});

server.tool("get_profit_loss", "Get profit and loss report", { start_date: z.string().default("2024-01-01"), end_date: z.string().default("2024-12-31") }, async ({ start_date, end_date }) => {
  try { return jsonResponse(await qbFetch(`/reports/ProfitAndLoss?start_date=${start_date}&end_date=${end_date}`)); } catch (e) { return errorResponse(e); }
});

server.tool("get_balance_sheet", "Get balance sheet report", { date: z.string().optional() }, async ({ date }) => {
  try {
    const params = date ? `?as_of_date=${date}` : "";
    return jsonResponse(await qbFetch(`/reports/BalanceSheet${params}`));
  } catch (e) { return errorResponse(e); }
});

startServer(server);
