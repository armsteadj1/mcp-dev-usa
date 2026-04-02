#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";

const accessToken = requireEnv("SHOPIFY_ACCESS_TOKEN");
const storeDomain = requireEnv("SHOPIFY_STORE_DOMAIN");
const apiVersion = "2024-10";
const baseUrl = `https://${storeDomain}/admin/api/${apiVersion}`;

async function shopifyFetch(path: string, method = "GET", body?: unknown): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Shopify API ${res.status}: ${await res.text()}`);
  return res.json();
}

const server = createServer({ name: "@mcp-dev-usa/shopify", version: "1.0.0" });

server.tool("list_products", "List products", { limit: z.number().default(10) }, async ({ limit }) => {
  try { return jsonResponse(await shopifyFetch(`/products.json?limit=${limit}`)); } catch (e) { return errorResponse(e); }
});

server.tool("get_product", "Get a product by ID", { product_id: z.string() }, async ({ product_id }) => {
  try { return jsonResponse(await shopifyFetch(`/products/${product_id}.json`)); } catch (e) { return errorResponse(e); }
});

server.tool("create_product", "Create a product", { title: z.string(), body_html: z.string().optional(), vendor: z.string().optional(), product_type: z.string().optional(), price: z.string().optional() }, async ({ title, body_html, vendor, product_type, price }) => {
  try {
    const product: Record<string, unknown> = { title };
    if (body_html) product.body_html = body_html;
    if (vendor) product.vendor = vendor;
    if (product_type) product.product_type = product_type;
    if (price) product.variants = [{ price }];
    return jsonResponse(await shopifyFetch("/products.json", "POST", { product }));
  } catch (e) { return errorResponse(e); }
});

server.tool("list_orders", "List orders", { limit: z.number().default(10), status: z.string().default("any") }, async ({ limit, status }) => {
  try { return jsonResponse(await shopifyFetch(`/orders.json?limit=${limit}&status=${status}`)); } catch (e) { return errorResponse(e); }
});

server.tool("get_order", "Get an order by ID", { order_id: z.string() }, async ({ order_id }) => {
  try { return jsonResponse(await shopifyFetch(`/orders/${order_id}.json`)); } catch (e) { return errorResponse(e); }
});

server.tool("list_customers", "List customers", { limit: z.number().default(10) }, async ({ limit }) => {
  try { return jsonResponse(await shopifyFetch(`/customers.json?limit=${limit}`)); } catch (e) { return errorResponse(e); }
});

server.tool("create_customer", "Create a customer", { first_name: z.string(), last_name: z.string(), email: z.string() }, async ({ first_name, last_name, email }) => {
  try { return jsonResponse(await shopifyFetch("/customers.json", "POST", { customer: { first_name, last_name, email } })); } catch (e) { return errorResponse(e); }
});

server.tool("list_inventory", "List inventory levels", { location_id: z.string() }, async ({ location_id }) => {
  try { return jsonResponse(await shopifyFetch(`/inventory_levels.json?location_ids=${location_id}`)); } catch (e) { return errorResponse(e); }
});

server.tool("get_shop_info", "Get shop information", {}, async () => {
  try { return jsonResponse(await shopifyFetch("/shop.json")); } catch (e) { return errorResponse(e); }
});

server.tool("count_products", "Count products", {}, async () => {
  try { return jsonResponse(await shopifyFetch("/products/count.json")); } catch (e) { return errorResponse(e); }
});

startServer(server);
