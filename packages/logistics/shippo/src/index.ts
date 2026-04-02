#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";
import { Shippo } from "shippo";

const apiKey = requireEnv("SHIPPO_API_KEY");
const shippo = new Shippo({ apiKeyHeader: apiKey });
const server = createServer({ name: "@mcp-dev-usa/shippo", version: "1.0.0" });

const addressSchema = z.object({
  name: z.string(), street1: z.string(), city: z.string(), state: z.string(),
  zip: z.string(), country: z.string().default("US"), street2: z.string().optional(),
});

server.tool("validate_address", "Validate a shipping address", { address: addressSchema }, async ({ address }) => {
  try { return jsonResponse(await shippo.addresses.create({ ...address, validate: true })); } catch (e) { return errorResponse(e); }
});

server.tool("create_shipment", "Create a shipment and get rates", {
  address_from: addressSchema, address_to: addressSchema,
  weight: z.number(), length: z.number(), width: z.number(), height: z.number(), mass_unit: z.string().default("lb"), distance_unit: z.string().default("in"),
}, async ({ address_from, address_to, weight, length, width, height, mass_unit, distance_unit }) => {
  try { return jsonResponse(await shippo.shipments.create({ addressFrom: address_from, addressTo: address_to, parcels: [{ weight: String(weight), length: String(length), width: String(width), height: String(height), massUnit: mass_unit as any, distanceUnit: distance_unit as any }] })); } catch (e) { return errorResponse(e); }
});

server.tool("get_rates", "Get shipping rates for a shipment", { shipment_id: z.string() }, async ({ shipment_id }) => {
  try { return jsonResponse(await shippo.shipments.get(shipment_id)); } catch (e) { return errorResponse(e); }
});

server.tool("purchase_label", "Purchase a shipping label from a rate", { rate_id: z.string() }, async ({ rate_id }) => {
  try { return jsonResponse(await shippo.transactions.create({ rate: rate_id, async: false } as any)); } catch (e) { return errorResponse(e); }
});

server.tool("track_shipment", "Track a shipment", { carrier: z.string(), tracking_number: z.string() }, async ({ carrier, tracking_number }) => {
  try { return jsonResponse(await shippo.trackingStatus.get(carrier, tracking_number)); } catch (e) { return errorResponse(e); }
});

server.tool("list_shipments", "List recent shipments", { results: z.number().default(10) }, async ({ results }) => {
  try { return jsonResponse(await shippo.shipments.list(1 as any)); } catch (e) { return errorResponse(e); }
});

server.tool("create_address", "Create a saved address", { address: addressSchema }, async ({ address }) => {
  try { return jsonResponse(await shippo.addresses.create(address)); } catch (e) { return errorResponse(e); }
});

server.tool("list_addresses", "List saved addresses", { results: z.number().default(10) }, async ({ results }) => {
  try { return jsonResponse(await shippo.addresses.list(1 as any)); } catch (e) { return errorResponse(e); }
});

server.tool("list_carriers", "List carrier accounts", {}, async () => {
  try { return jsonResponse(await shippo.carrierAccounts.list({} as any)); } catch (e) { return errorResponse(e); }
});

server.tool("get_transaction", "Get a transaction/label by ID", { transaction_id: z.string() }, async ({ transaction_id }) => {
  try { return jsonResponse(await shippo.transactions.get(transaction_id)); } catch (e) { return errorResponse(e); }
});

startServer(server);
