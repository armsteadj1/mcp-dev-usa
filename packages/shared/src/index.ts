import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export { z };
export { McpServer };

export interface ServerConfig {
  name: string;
  version: string;
  description?: string;
}

export function createServer(config: ServerConfig): McpServer {
  return new McpServer({
    name: config.name,
    version: config.version,
  });
}

export async function startServer(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server running on stdio");
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`ERROR: Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

export class McpToolError extends Error {
  constructor(
    message: string,
    public readonly code: string = "TOOL_ERROR",
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "McpToolError";
  }
}

export function toolResponse(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

export function jsonResponse(data: unknown) {
  return toolResponse(JSON.stringify(data, null, 2));
}

export function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}
