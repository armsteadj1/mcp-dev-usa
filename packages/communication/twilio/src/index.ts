#!/usr/bin/env node
import { createServer, startServer, requireEnv, z, jsonResponse, errorResponse } from "@mcp-dev-usa/shared";
import twilio from "twilio";

const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
const authToken = requireEnv("TWILIO_AUTH_TOKEN");
const client = twilio(accountSid, authToken);
const server = createServer({ name: "@mcp-dev-usa/twilio", version: "1.0.0" });

server.tool("send_sms", "Send an SMS message", { to: z.string(), from: z.string(), body: z.string() }, async ({ to, from, body }) => {
  try { return jsonResponse(await client.messages.create({ to, from, body })); } catch (e) { return errorResponse(e); }
});

server.tool("list_messages", "List recent messages", { limit: z.number().default(10) }, async ({ limit }) => {
  try { return jsonResponse(await client.messages.list({ limit })); } catch (e) { return errorResponse(e); }
});

server.tool("get_message", "Get a message by SID", { sid: z.string() }, async ({ sid }) => {
  try { return jsonResponse(await client.messages(sid).fetch()); } catch (e) { return errorResponse(e); }
});

server.tool("make_call", "Initiate a phone call", { to: z.string(), from: z.string(), twiml: z.string() }, async ({ to, from, twiml }) => {
  try { return jsonResponse(await client.calls.create({ to, from, twiml })); } catch (e) { return errorResponse(e); }
});

server.tool("list_calls", "List recent calls", { limit: z.number().default(10) }, async ({ limit }) => {
  try { return jsonResponse(await client.calls.list({ limit })); } catch (e) { return errorResponse(e); }
});

server.tool("list_phone_numbers", "List owned phone numbers", { limit: z.number().default(20) }, async ({ limit }) => {
  try { return jsonResponse(await client.incomingPhoneNumbers.list({ limit })); } catch (e) { return errorResponse(e); }
});

server.tool("lookup_phone", "Look up a phone number", { phone_number: z.string() }, async ({ phone_number }) => {
  try { return jsonResponse(await client.lookups.v2.phoneNumbers(phone_number).fetch()); } catch (e) { return errorResponse(e); }
});

server.tool("get_account_info", "Get account information", {}, async () => {
  try { return jsonResponse(await client.api.accounts(accountSid).fetch()); } catch (e) { return errorResponse(e); }
});

server.tool("list_conversations", "List conversations", { limit: z.number().default(10) }, async ({ limit }) => {
  try { return jsonResponse(await client.conversations.v1.conversations.list({ limit })); } catch (e) { return errorResponse(e); }
});

server.tool("send_whatsapp", "Send a WhatsApp message", { to: z.string(), from: z.string(), body: z.string() }, async ({ to, from, body }) => {
  try { return jsonResponse(await client.messages.create({ to: `whatsapp:${to}`, from: `whatsapp:${from}`, body })); } catch (e) { return errorResponse(e); }
});

startServer(server);
