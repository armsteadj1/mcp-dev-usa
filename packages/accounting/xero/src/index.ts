#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const accessToken = requireEnv("XERO_ACCESS_TOKEN");
const tenantId = requireEnv("XERO_TENANT_ID");
const baseUrl = "https://api.xero.com/api.xro/2.0";
const xero = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, { method, headers: { "Authorization": `Bearer ${accessToken}`, "Xero-Tenant-Id": tenantId, "Content-Type": "application/json", "Accept": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const server = createServer({ name: "@mcp-dev-usa/xero", version: "1.0.0" });

server.tool("list_invoices", "List Xero invoices", { page: z.number().default(1), status: z.string().optional() }, async ({ page, status }) => {
  try { return jsonResponse(await xero("GET", `/Invoices?page=${page}${status ? `&Statuses=${status}` : ""}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_invoice", "Create an invoice", { contact_id: z.string(), line_items: z.array(z.object({ description: z.string(), quantity: z.number(), unit_amount: z.number(), account_code: z.string() })) }, async ({ contact_id, line_items }) => {
  try { return jsonResponse(await xero("POST", "/Invoices", { Invoices: [{ Type: "ACCREC", Contact: { ContactID: contact_id }, LineItems: line_items.map(l => ({ Description: l.description, Quantity: l.quantity, UnitAmount: l.unit_amount, AccountCode: l.account_code })) }] })); } catch (e) { return errorResponse(e); }
});
server.tool("list_contacts", "List contacts", { page: z.number().default(1) }, async ({ page }) => {
  try { return jsonResponse(await xero("GET", `/Contacts?page=${page}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_contact", "Create a contact", { name: z.string(), email: z.string().optional() }, async ({ name, email }) => {
  try { return jsonResponse(await xero("POST", "/Contacts", { Contacts: [{ Name: name, EmailAddress: email }] })); } catch (e) { return errorResponse(e); }
});
server.tool("list_accounts", "List chart of accounts", { type: z.string().optional() }, async ({ type }) => {
  try { return jsonResponse(await xero("GET", `/Accounts${type ? `?Type=${type}` : ""}`)); } catch (e) { return errorResponse(e); }
});
server.tool("get_profit_and_loss", "Get P&L report", { from_date: z.string().optional(), to_date: z.string().optional() }, async ({ from_date, to_date }) => {
  try { return jsonResponse(await xero("GET", `/Reports/ProfitAndLoss${from_date ? `?fromDate=${from_date}&toDate=${to_date}` : ""}`)); } catch (e) { return errorResponse(e); }
});
server.tool("get_balance_sheet", "Get balance sheet", { date: z.string().optional() }, async ({ date }) => {
  try { return jsonResponse(await xero("GET", `/Reports/BalanceSheet${date ? `?date=${date}` : ""}`)); } catch (e) { return errorResponse(e); }
});
server.tool("list_bank_transactions", "List bank transactions", { page: z.number().default(1) }, async ({ page }) => {
  try { return jsonResponse(await xero("GET", `/BankTransactions?page=${page}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_payment", "Create a payment against an invoice", { invoice_id: z.string(), account_id: z.string(), amount: z.number() }, async ({ invoice_id, account_id, amount }) => {
  try { return jsonResponse(await xero("POST", "/Payments", { Payments: [{ Invoice: { InvoiceID: invoice_id }, Account: { AccountID: account_id }, Amount: amount }] })); } catch (e) { return errorResponse(e); }
});
server.tool("get_organisation", "Get organisation details", {}, async () => {
  try { return jsonResponse(await xero("GET", "/Organisation")); } catch (e) { return errorResponse(e); }
});
startServer(server);
