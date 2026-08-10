import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { AppContext } from "../api/app-context.ts";
import { createIrisMcpServer } from "./create-iris-mcp-server.ts";

/**
 * MCP is gated by Bearer token — not by Host. In dev, ngrok/ChatGPT send a public
 * Host header, so a localhost-only allowlist returned 403 and broke remote clients.
 */
export function isAllowedMcpHost(_req: IncomingMessage, _isProduction: boolean): boolean {
  return true;
}

export class IrisMcpGateway {
  private readonly ctx: AppContext;

  constructor(ctx: AppContext) {
    this.ctx = ctx;
  }

  async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    parsedBody?: unknown,
  ): Promise<void> {
    const server = createIrisMcpServer(this.ctx);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    try {
      await transport.handleRequest(req, res, parsedBody);
    } finally {
      await server.close();
    }
  }
}
