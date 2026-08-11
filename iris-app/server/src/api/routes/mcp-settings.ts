import type { IncomingMessage } from "node:http";
import { sendJson } from "../json.ts";
import { createAdminPathRouter } from "../router.ts";
import type { AppContext } from "../app-context.ts";
import {
  generateMcpConnectionCode,
  hashMcpConnectionCode,
  mcpConnectionCodeHint,
} from "../../domain/mcp-connection-verifier.ts";

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

export const handleMcpSettingsRoute = createAdminPathRouter("/api/settings/mcp", {
  GET: async (match) => {
    sendJson(match.res, 200, serializeMcpSettings(match.req, match.ctx));
  },
  POST: async (match) => {
    const connectionCode = generateMcpConnectionCode();
    const saved = match.ctx.mcpConnectionStore.upsert({
      codeHash: hashMcpConnectionCode(connectionCode),
      codeHint: mcpConnectionCodeHint(connectionCode),
    });

    sendJson(match.res, 200, {
      connection_code: connectionCode,
      code_hint: saved.codeHint,
      mcp_path: "/mcp",
      mcp_url: resolveMcpUrl(match.req, match.ctx),
      updated_at: saved.updatedAt,
    });
  },
  DELETE: async (match) => {
    match.ctx.mcpConnectionStore.clear();
    sendJson(match.res, 200, serializeMcpSettings(match.req, match.ctx));
  },
});
