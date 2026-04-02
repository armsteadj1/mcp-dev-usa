#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const apiKey = requireEnv("SHIPSTATION_API_KEY");
const apiSecret = requireEnv("SHIPSTATION_API_SECRET");
const baseUrl = "https://ssapi.shipstation.com";
const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
const ss = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, { method, headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const server = createServer({ name: "@mcp-dev-usa/shipstation", version: "1.0.0" });

server.tool("list_orders", "List orders", { page: z.number().default(1), pageSize: z.number().default(25), orderStatus: z.string().optional() }, async ({ page, pageSize, orderStatus }) => {
  try { return jsonResponse(await ss("GET", `/orders?page=${page}&pageSize=${pageSize}${orderStatus ? `&orderStatus=${orderStatus}` : ""}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_order", "Create/update an order", { orderNumber: z.string(), orderDate: z.string(), orderStatus: z.string().default("awaiting_shipment"), billTo: z.object({ name: z.string(), street1: z.string(), city: z.string(), state: z.string(), postalCode: z.string(), country: z.string().default("US") }), shipTo: z.object({ name: z.string(), street1: z.string(), city: z.string(), state: z.string(), postalCode: z.string(), country: z.string().default("US") }), items: z.array(z.object({ name: z.string(), quantity: z.number(), unitPrice: z.number() })) }, async (order) => {
  try { return jsonResponse(await ss("POST", "/orders/createorder", order)); } catch (e) { return errorResponse(e); }
});
server.tool("get_rates", "Get shipping rates", { carrierCode: z.string(), fromPostalCode: z.string(), toPostalCode: z.string(), toCountry: z.string().default("US"), weight: z.object({ value: z.number(), units: z.string().default("ounces") }) }, async (params) => {
  try { return jsonResponse(await ss("POST", "/shipments/getrates", params)); } catch (e) { return errorResponse(e); }
});
server.tool("create_label", "Create a shipping label", { orderId: z.number(), carrierCode: z.string(), serviceCode: z.string(), weight: z.object({ value: z.number(), units: z.string().default("ounces") }) }, async (params) => {
  try { return jsonResponse(await ss("POST", "/shipments/createlabel", { ...params, testLabel: false })); } catch (e) { return errorResponse(e); }
});
server.tool("list_carriers", "List available carriers", {}, async () => {
  try { return jsonResponse(await ss("GET", "/carriers")); } catch (e) { return errorResponse(e); }
});
server.tool("list_warehouses", "List warehouses", {}, async () => {
  try { return jsonResponse(await ss("GET", "/warehouses")); } catch (e) { return errorResponse(e); }
});
server.tool("list_shipments", "List shipments", { page: z.number().default(1), pageSize: z.number().default(25) }, async ({ page, pageSize }) => {
  try { return jsonResponse(await ss("GET", `/shipments?page=${page}&pageSize=${pageSize}`)); } catch (e) { return errorResponse(e); }
});
server.tool("void_label", "Void a shipping label", { shipmentId: z.number() }, async ({ shipmentId }) => {
  try { return jsonResponse(await ss("POST", "/shipments/voidlabel", { shipmentId })); } catch (e) { return errorResponse(e); }
});
startServer(server);
