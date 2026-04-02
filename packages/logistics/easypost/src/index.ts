#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const apiKey = requireEnv("EASYPOST_API_KEY");
const baseUrl = "https://api.easypost.com/v2";
const ep = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, { method, headers: { "Authorization": `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const server = createServer({ name: "@mcp-dev-usa/easypost", version: "1.0.0" });

server.tool("create_shipment", "Create a shipment and get rates", { from: z.object({ name: z.string(), street1: z.string(), city: z.string(), state: z.string(), zip: z.string(), country: z.string().default("US") }), to: z.object({ name: z.string(), street1: z.string(), city: z.string(), state: z.string(), zip: z.string(), country: z.string().default("US") }), parcel: z.object({ length: z.number(), width: z.number(), height: z.number(), weight: z.number() }) }, async ({ from, to, parcel }) => {
  try { return jsonResponse(await ep("POST", "/shipments", { shipment: { from_address: from, to_address: to, parcel } })); } catch (e) { return errorResponse(e); }
});
server.tool("buy_shipment", "Buy a rate for a shipment", { shipment_id: z.string(), rate_id: z.string() }, async ({ shipment_id, rate_id }) => {
  try { return jsonResponse(await ep("POST", `/shipments/${shipment_id}/buy`, { rate: { id: rate_id } })); } catch (e) { return errorResponse(e); }
});
server.tool("track_shipment", "Track a shipment", { tracker_id: z.string() }, async ({ tracker_id }) => {
  try { return jsonResponse(await ep("GET", `/trackers/${tracker_id}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_tracker", "Create a tracker by carrier and tracking code", { tracking_code: z.string(), carrier: z.string() }, async ({ tracking_code, carrier }) => {
  try { return jsonResponse(await ep("POST", "/trackers", { tracker: { tracking_code, carrier } })); } catch (e) { return errorResponse(e); }
});
server.tool("verify_address", "Verify an address", { street1: z.string(), city: z.string(), state: z.string(), zip: z.string(), country: z.string().default("US") }, async (addr) => {
  try { return jsonResponse(await ep("POST", "/addresses/create_and_verify", { address: addr })); } catch (e) { return errorResponse(e); }
});
server.tool("list_shipments", "List recent shipments", { page_size: z.number().default(10) }, async ({ page_size }) => {
  try { return jsonResponse(await ep("GET", `/shipments?page_size=${page_size}`)); } catch (e) { return errorResponse(e); }
});
server.tool("create_return", "Create a return shipment", { shipment_id: z.string() }, async ({ shipment_id }) => {
  try { const orig = await ep("GET", `/shipments/${shipment_id}`); return jsonResponse(await ep("POST", "/shipments", { shipment: { from_address: (orig as any).to_address, to_address: (orig as any).from_address, parcel: (orig as any).parcel, is_return: true } })); } catch (e) { return errorResponse(e); }
});
server.tool("get_rates", "Get shipping rates for a shipment", { shipment_id: z.string() }, async ({ shipment_id }) => {
  try { return jsonResponse(await ep("GET", `/shipments/${shipment_id}`)); } catch (e) { return errorResponse(e); }
});
startServer(server);
