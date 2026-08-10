import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { AppContext } from "../api/app-context.ts";
import { createIrisMcpServer } from "./create-iris-mcp-server.ts";

const LOCALHOST_HOSTS = ["127.0.0.1", "localhost", "[::1]", "::1"];

export function isAllowedMcpHost(req: IncomingMessage, isProduction: boolean): boolean {
  if (isProduction) {
    return true;
  }

  const hostHeader = req.headers.host ?? "";
  const hostname = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  return LOCALHOST_HOSTS.includes(hostname);
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
