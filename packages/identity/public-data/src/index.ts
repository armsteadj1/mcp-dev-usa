#!/usr/bin/env node
import { createServer, startServer, z, jsonResponse, errorResponse, toolResponse } from "@mcp-dev-usa/shared";

const server = createServer({ name: "@mcp-dev-usa/public-data", version: "1.0.0" });

async function fetchJson(url: string, headers?: Record<string, string>): Promise<unknown> {
  const res = await fetch(url, { headers: { "User-Agent": "mcp-dev-usa/1.0", Accept: "application/json", ...headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

// USPS / Zip Code tools (using zippopotam.us free API)
server.tool("lookup_zip", "Look up city/state for a US zip code", { zip: z.string().length(5) }, async ({ zip }) => {
  try { return jsonResponse(await fetchJson(`https://api.zippopotam.us/us/${zip}`)); } catch (e) { return errorResponse(e); }
});

server.tool("lookup_city_state", "Find zip codes for a city and state", { city: z.string(), state: z.string().length(2) }, async ({ city, state }) => {
  try { return jsonResponse(await fetchJson(`https://api.zippopotam.us/us/${state}/${city.replace(/ /g, "%20")}`)); } catch (e) { return errorResponse(e); }
});

// SEC EDGAR
server.tool("search_sec_company", "Search SEC EDGAR for a company", { query: z.string() }, async ({ query }) => {
  try { return jsonResponse(await fetchJson(`https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(query)}&dateRange=custom&startdt=2020-01-01&enddt=2025-12-31`)); } catch (e) { return errorResponse(e); }
});

server.tool("get_sec_filings", "Get SEC filings for a company by CIK", { cik: z.string(), type: z.string().default("10-K"), count: z.number().default(5) }, async ({ cik, type, count }) => {
  try {
    const paddedCik = cik.padStart(10, "0");
    return jsonResponse(await fetchJson(`https://data.sec.gov/submissions/CIK${paddedCik}.json`));
  } catch (e) { return errorResponse(e); }
});

server.tool("get_sec_company_facts", "Get XBRL company facts from SEC", { cik: z.string() }, async ({ cik }) => {
  try {
    const paddedCik = cik.padStart(10, "0");
    return jsonResponse(await fetchJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${paddedCik}.json`));
  } catch (e) { return errorResponse(e); }
});

server.tool("search_sec_full_text", "Full-text search SEC EDGAR filings", { query: z.string(), form_type: z.string().optional() }, async ({ query, form_type }) => {
  try {
    let url = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(query)}`;
    if (form_type) url += `&forms=${form_type}`;
    return jsonResponse(await fetchJson(url));
  } catch (e) { return errorResponse(e); }
});

// Federal holidays / date tools
server.tool("get_federal_holidays", "Get US federal holidays for a year", { year: z.number().default(2025) }, async ({ year }) => {
  try { return jsonResponse(await fetchJson(`https://date.nager.at/api/v3/publicholidays/${year}/US`)); } catch (e) { return errorResponse(e); }
});

// FEC - campaign finance
server.tool("search_fec_candidates", "Search FEC candidate data", { name: z.string() }, async ({ name }) => {
  try { return jsonResponse(await fetchJson(`https://api.open.fec.gov/v1/candidates/search/?name=${encodeURIComponent(name)}&api_key=DEMO_KEY`)); } catch (e) { return errorResponse(e); }
});

// US Census / demographic data
server.tool("get_state_population", "Get US state population data", { state_fips: z.string().default("*") }, async ({ state_fips }) => {
  try { return jsonResponse(await fetchJson(`https://api.census.gov/data/2020/dec/pl?get=P1_001N,NAME&for=state:${state_fips}`)); } catch (e) { return errorResponse(e); }
});

// Congress API
server.tool("search_congress_bills", "Search US Congress bills", { query: z.string(), limit: z.number().default(5) }, async ({ query, limit }) => {
  try { return jsonResponse(await fetchJson(`https://api.congress.gov/v3/bill?format=json&limit=${limit}&query=${encodeURIComponent(query)}&api_key=DEMO_KEY`)); } catch (e) { return errorResponse(e); }
});

startServer(server);
