import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { AppContext } from "../api/app-context.ts";
import { createIrisMcpServer } from "./create-iris-mcp-server.ts";
import {
  isMcpToolCallAllowed,
  mcpToolPermissionDeniedMessage,
  resolveActiveMcpPermissionPolicy,
} from "./mcp-permission-guard.ts";

function isToolsCallBody(body: unknown): body is {
  method: "tools/call";
  params: { name: string };
} {
  return (
    !!body &&
    typeof body === "object" &&
    (body as { method?: string }).method === "tools/call" &&
    typeof (body as { params?: { name?: unknown } }).params?.name === "string"
  );
}

function sendMcpToolPermissionDenied(
  res: ServerResponse,
  requestBody: { id?: unknown },
  toolName: string,
): void {
  const message =
    mcpToolPermissionDeniedMessage(toolName) ??
    `permission denied: ${toolName}`;

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      jsonrpc: "2.0",
      id: requestBody.id ?? null,
      result: {
        content: [{ type: "text", text: message }],
        isError: true,
      },
    }),
  );
}

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
    if (isToolsCallBody(parsedBody)) {
      const policy = resolveActiveMcpPermissionPolicy(
        this.ctx.mcpPermissionStore.get(),
      );
      if (!isMcpToolCallAllowed(policy, parsedBody.params.name)) {
        sendMcpToolPermissionDenied(res, parsedBody, parsedBody.params.name);
        return;
      }
    }

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
