import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthContext } from "../auth.ts";
import { requireAdmin } from "../auth.ts";
import type { AppContext } from "../app-context.ts";
import { sendError, sendJson } from "../json.ts";
import {
  generateMcpConnectionCode,
  hashMcpConnectionCode,
  mcpConnectionCodeHint,
} from "../../domain/mcp-connection-verifier.ts";

type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
};

function resolveMcpUrl(req: IncomingMessage, ctx: AppContext): string {
  const publicBase = ctx.publicBaseUrl?.trim();
  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/mcp`;
  }

  const host = req.headers.host ?? "127.0.0.1:8792";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${proto}://${host}/mcp`;
}

function serializeMcpSettings(req: IncomingMessage, ctx: AppContext) {
  const stored = ctx.mcpConnectionStore.get();
  const sources = ctx.mcpVerifier.configuredSources();
  const configured = ctx.mcpVerifier.isConfigured();

  return {
    configured,
    source: sources.database
      ? "database"
      : sources.environment
        ? "environment"
        : configured
          ? "development_default"
          : null,
    code_hint: stored?.codeHint ?? null,
    mcp_path: "/mcp",
    mcp_url: resolveMcpUrl(req, ctx),
    updated_at: stored?.updatedAt ?? null,
    env_override: sources.environment,
  };
}

export async function handleMcpSettingsRoute(request: RouteRequest): Promise<boolean> {
  const { req, res, ctx, auth } = request;
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  if (pathname !== "/api/settings/mcp") {
    return false;
  }

  if (!requireAdmin(auth)) {
    sendError(res, 403, "admin token required");
    return true;
  }

  if (req.method === "GET") {
    sendJson(res, 200, serializeMcpSettings(req, ctx));
    return true;
  }

  if (req.method === "POST") {
    const connectionCode = generateMcpConnectionCode();
    const saved = ctx.mcpConnectionStore.upsert({
      codeHash: hashMcpConnectionCode(connectionCode),
      codeHint: mcpConnectionCodeHint(connectionCode),
    });

    sendJson(res, 200, {
      connection_code: connectionCode,
      code_hint: saved.codeHint,
      mcp_path: "/mcp",
      mcp_url: resolveMcpUrl(req, ctx),
      updated_at: saved.updatedAt,
    });
    return true;
  }

  if (req.method === "DELETE") {
    ctx.mcpConnectionStore.clear();
    sendJson(res, 200, serializeMcpSettings(req, ctx));
    return true;
  }

  sendError(res, 405, "method not allowed");
  return true;
}
