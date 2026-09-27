import { createServer as createHttpServer, type Server } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, normalize } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "../adapters/sqlite/connection.ts";
import { runMigrations, countAppliedMigrations } from "../adapters/sqlite/migrate.ts";
import { authenticateRequest, extractBearerToken } from "./auth.ts";
import { createAppContext, type AppContext } from "./app-context.ts";
import { sendError, readRawBody } from "./json.ts";
import { handlePostsRoute } from "./routes/posts.ts";
import { handleAssetsRoute } from "./routes/assets.ts";
import { handleEventsRoute } from "./routes/events.ts";
import { handlePublishMediaRoute } from "./routes/publish-media.ts";
import { handleUploadAssetRoute } from "./routes/upload-asset.ts";
import { handleMetaWebhookRoute, ingestMetaWebhook } from "./routes/meta-webhook.ts";
import { readWebhookEntryIds, verifyHubSignature } from "../domain/meta/meta-webhook.ts";
import { handleCommentsRoute } from "./routes/comments/index.ts";
import { handleInsightsRoute } from "./routes/insights.ts";
import { handleAuthRoute } from "./routes/auth.ts";
import { handleContactRoute } from "./routes/contact.ts";
import { handleMcpAuthRoute } from "./routes/mcp-auth.ts";
import { handleMetaAuthRoute } from "./routes/meta-auth.ts";
import { readMetaOAuthAccountId } from "../domain/meta/meta-oauth-state.ts";
import { handleMetaRoute } from "./routes/meta.ts";
import { handleMcpSettingsRoute } from "./routes/mcp-settings.ts";
import { handleMcpPermissionsSettingsRoute } from "./routes/mcp-permissions-settings.ts";
import { handleSettingsRoute } from "./routes/settings.ts";
import {
  handleLlmSettingsRoute,
  handleWebhookEventsSettingsRoute,
} from "./routes/settings-llm.ts";
import { handleAppSettingsRoute } from "./routes/app-settings.ts";
import { handleAgentContentSettingsRoute } from "./routes/settings-agent-content.ts";
import { handleMessageAgentContentSettingsRoute } from "./routes/settings-message-agent-content.ts";
import {
  handleOperatorNotificationSettingsRoute,
  handleOperatorNotificationTestRoute,
} from "./routes/operator-notification-settings.ts";
import { handleProductsRoute } from "./routes/products.ts";
import { handleStoreConnectionsRoute } from "./routes/store-connections.ts";
import { handleProductStoreRoute } from "./routes/product-store.ts";
import { handleConversationsRoute } from "./routes/conversations/index.ts";
import { handleMessagesRoute } from "./routes/messages/index.ts";
import { handleAgentRunsRoute } from "./routes/agent-runs.ts";
import { handleAgentReplyQueueRoute } from "./routes/agent-reply-queue.ts";
import { handleAgentSimulatorRoute } from "./routes/agent-simulator.ts";
import { applyCorsIfNeeded } from "./cors.ts";
import type { ViteDevServer } from "vite";
import { startPublishScheduler } from "../workers/publish-scheduler.ts";
import { startCommentResponder } from "../workers/comment-responder.ts";
import { startMessageResponder } from "../workers/message-responder.ts";
import { startDataRetention } from "../workers/data-retention.ts";
import { startAutoMonitorMedia } from "../workers/auto-monitor-media.ts";
import { startAccountWorkers } from "../workers/account-workers.ts";
import { readTenancyConfig, type TenancyConfig } from "../domain/accounts/tenancy-config.ts";
import { createTenancyRuntime, type TenancyRuntime } from "./tenancy-runtime.ts";
import { verifySessionToken, readSessionToken } from "./session.ts";
import { readAdminSession } from "../domain/auth/auth-session.ts";
import { shouldGateSpaGet, resolveLegacyAdminRedirect } from "./spa-route-policy.ts";
import { resolveDocsRedirect } from "./docs-route-policy.ts";
import { serveDocsNotFound, sendSafeRedirect } from "./serve-docs-static.ts";
import { IrisMcpGateway, isAllowedMcpHost } from "../mcp/gateway.ts";
import { PUBLIC_DIR } from "../paths.ts";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".wasm": "application/wasm",
  ".xml": "application/xml",
};

export type HttpServerOptions = {
  dbPath?: string;
  skipMigrations?: boolean;
  adminToken?: string;
  agentToken?: string;
  mediaRoot?: string;
  encryptionKey?: string;
  metaAccessToken?: string;
  igUserId?: string;
  publicBaseUrl?: string;
  publishUrlSecret?: string;
  graphApiVersion?: string;
  metaAppSecret?: string;
  metaWebhookVerifyToken?: string;
  emailSender?: import("../ports/email-sender.ts").EmailSender;
  startScheduler?: boolean;
  publishTickMs?: number;
  replyTickMs?: number;
  mcpConnectionCode?: string;
  tenancy?: TenancyConfig;
  controlDbPath?: string;
};

const MCP_BODY_LIMIT = 20 * 1024 * 1024;

export type HttpServerHandle = {
  server: Server;
  db: DatabaseSync;
  ctx: AppContext;
  stopScheduler: () => void;
  closeDatabase: () => void;
  setAdminVite: (vite: ViteDevServer) => void;
  closeAdminVite: () => Promise<void>;
};

function resolvePublicPath(pathname: string): string | null {
  const relativePath = pathname === "/" ? "/index.html" : pathname;
  const safePath = normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  let absolutePath = join(PUBLIC_DIR, safePath);

  if (!absolutePath.startsWith(PUBLIC_DIR)) {
    return null;
  }

  if (existsSync(absolutePath) && statSync(absolutePath).isDirectory()) {
    absolutePath = join(absolutePath, "index.html");
  } else if (!existsSync(absolutePath) && extname(absolutePath) === "") {
    const withIndex = join(absolutePath, "index.html");
    if (existsSync(withIndex)) {
      absolutePath = withIndex;
    }
  }

  return absolutePath;
}

function sendFile(filePath: string, res: ServerResponse): void {
  const body = readFileSync(filePath);
  const contentType = MIME_TYPES[extname(filePath)] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  res.end(body);
}

function serveStatic(pathname: string, res: ServerResponse): void {
  const filePath = resolvePublicPath(pathname);

  if (!filePath || !existsSync(filePath)) {
    if (serveDocsNotFound(pathname, res, PUBLIC_DIR)) {
      return;
    }

    const hasExtension = extname(pathname) !== "";
    if (!hasExtension && reqAcceptsSpa(pathname)) {
      const spaIndex = join(PUBLIC_DIR, "index.html");
      if (existsSync(spaIndex)) {
        sendFile(spaIndex, res);
        return;
      }
    }

    sendError(res, 404, "Not found");
    return;
  }

  sendFile(filePath, res);
}

function reqAcceptsSpa(pathname: string): boolean {
  return (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/auth/meta") &&
    !pathname.startsWith("/docs")
  );
}

function delegateToVite(
  vite: ViteDevServer,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  return new Promise((resolve, reject) => {
    vite.middlewares(req, res, (error?: unknown) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function resolveTenancyContext(
  req: IncomingMessage,
  pathname: string,
  fallback: AppContext,
  tenancy: TenancyRuntime | null,
): { kind: "ok"; ctx: AppContext } | { kind: "missing" } {
  if (!tenancy) {
    return { kind: "ok", ctx: fallback };
  }

  if (pathname === "/auth/meta/callback" || pathname === "/auth/meta/page/callback") {
    const state = new URL(req.url ?? "/", "http://localhost").searchParams.get("state");
    const secret = process.env.IRIS_SESSION_SECRET ?? "";
    const flow = pathname === "/auth/meta/page/callback" ? "page" : "instagram";
    const accountId = state && secret ? readMetaOAuthAccountId(state, secret, flow) : null;
    if (accountId) {
      const accountCtx = tenancy.contextForAccount(accountId);
      return accountCtx ? { kind: "ok", ctx: accountCtx } : { kind: "missing" };
    }
  }

  const session = verifySessionToken(readSessionToken(req));
  if (session.accountId) {
    const accountCtx = tenancy.contextForAccount(session.accountId);
    return accountCtx ? { kind: "ok", ctx: accountCtx } : { kind: "missing" };
  }

  return { kind: "ok", ctx: fallback };
}

async function handleMcpRoute(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
  pathname: string,
  gateway: IrisMcpGateway,
  tenancy: TenancyRuntime | null,
): Promise<boolean> {
  if (pathname !== "/mcp") {
    return false;
  }

  if (!isAllowedMcpHost(req, process.env.NODE_ENV === "production")) {
    sendError(res, 403, "Forbidden");
    return true;
  }

  const token = extractBearerToken(req);
  if (tenancy) {
    if (!token) {
      res.writeHead(401, {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Bearer realm="iris-mcp"',
      });
      res.end(JSON.stringify({ error: "Authorization required" }));
      return true;
    }
    const accountCtx = tenancy.contextForMcpCode(token);
    if (!accountCtx) {
      res.writeHead(401, {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Bearer realm="iris-mcp"',
      });
      res.end(JSON.stringify({ error: "Authorization required" }));
      return true;
    }
    let parsedBody: unknown;
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      try {
        const raw = await readRawBody(req, MCP_BODY_LIMIT);
        parsedBody = raw.length > 0 ? JSON.parse(raw.toString("utf8")) : undefined;
      } catch {
        sendError(res, 400, "Invalid request body");
        return true;
      }
    }
    await gateway.handleRequest(req, res, parsedBody, accountCtx);
    return true;
  }

  if (!ctx.mcpVerifier.isConfigured()) {
    sendError(res, 503, "MCP connection is not configured");
    return true;
  }

  if (!ctx.mcpVerifier.verify(token)) {
    res.writeHead(401, {
      "Content-Type": "application/json",
      "WWW-Authenticate": 'Bearer realm="iris-mcp"',
    });
    res.end(JSON.stringify({ error: "Authorization required" }));
    return true;
  }

  let parsedBody: unknown;
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    try {
      const raw = await readRawBody(req, MCP_BODY_LIMIT);
      parsedBody = raw.length > 0 ? JSON.parse(raw.toString("utf8")) : undefined;
    } catch {
      sendError(res, 400, "Invalid request body");
      return true;
    }
  }

  await gateway.handleRequest(req, res, parsedBody);
  return true;
}

async function handleSharedMetaWebhook(
  req: IncomingMessage,
  res: ServerResponse,
  serverCtx: AppContext,
  tenancy: TenancyRuntime,
): Promise<void> {
  if (req.method === "GET") {
    await handleMetaWebhookRoute(req, res, serverCtx, "/webhooks/meta");
    return;
  }
  if (req.method !== "POST") {
    sendError(res, 405, "method not allowed");
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-hub-signature-256"];
  const signatureHeader = Array.isArray(signature) ? signature[0] : signature;
  if (!verifyHubSignature(rawBody, signatureHeader, serverCtx.metaAppSecret || "")) {
    sendError(res, 403, "invalid signature");
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8")) as unknown;
  } catch {
    sendError(res, 400, "invalid json payload");
    return;
  }

  const accountCtx = readWebhookEntryIds(payload)
    .map((id) => tenancy.contextForIgUserId(id))
    .find((match) => match !== null);
  if (!accountCtx) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  await ingestMetaWebhook(res, accountCtx, rawBody, signatureHeader);
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
  adminVite: ViteDevServer | undefined,
  mcpGateway: IrisMcpGateway,
  tenancy: TenancyRuntime | null,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const { pathname } = url;

  if (tenancy && pathname.startsWith("/webhooks/meta/")) {
    sendError(res, 404, "Not found");
    return;
  }
  if (tenancy && pathname === "/webhooks/meta") {
    await handleSharedMetaWebhook(req, res, ctx, tenancy);
    return;
  }

  const resolved = resolveTenancyContext(req, pathname, ctx, tenancy);
  if (resolved.kind === "missing") {
    sendError(res, 404, "Not found");
    return;
  }
  ctx = resolved.ctx;

  if (req.method === "GET" && pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    const docsRedirect = resolveDocsRedirect(pathname);
    if (docsRedirect && sendSafeRedirect(res, docsRedirect)) {
      return;
    }
  }

  if (handlePublishMediaRoute(req, res, ctx, pathname)) {
    return;
  }

  if (await handleUploadAssetRoute(req, res, ctx, pathname)) {
    return;
  }

  if (await handleMetaWebhookRoute(req, res, ctx, pathname)) {
    return;
  }

  if (await handleMetaAuthRoute(req, res, ctx, pathname)) {
    return;
  }

  if (await handleMcpRoute(req, res, ctx, pathname, mcpGateway, tenancy)) {
    return;
  }

  if (pathname.startsWith("/api/")) {
    if (applyCorsIfNeeded(req, res)) {
      return;
    }

    if (await handleAuthRoute(req, res, ctx, pathname, tenancy)) {
      return;
    }

    if (await handleContactRoute(req, res, ctx, pathname)) {
      return;
    }

    if (await handleMcpAuthRoute(req, res, ctx, pathname)) {
      return;
    }

    const authResult = authenticateRequest(req, ctx.auth);
    if (!authResult.ok) {
      sendError(res, authResult.status, authResult.message);
      return;
    }

    const routeRequest = {
      req,
      res,
      ctx,
      auth: authResult.context,
    };

    if (await handleAssetsRoute(routeRequest)) {
      return;
    }

    if (handleEventsRoute(routeRequest)) {
      return;
    }

    if (await handleInsightsRoute(routeRequest)) {
      return;
    }

    if (await handleCommentsRoute(routeRequest)) {
      return;
    }

    if (await handleAgentSimulatorRoute(routeRequest)) {
      return;
    }

    if (await handleAgentRunsRoute(routeRequest)) {
      return;
    }

    if (await handleAgentReplyQueueRoute(routeRequest)) {
      return;
    }

    if (await handleMetaRoute(routeRequest)) {
      return;
    }

    if (await handleSettingsRoute(routeRequest)) {
      return;
    }

    if (await handleLlmSettingsRoute(routeRequest)) {
      return;
    }

    if (await handleWebhookEventsSettingsRoute(routeRequest)) {
      return;
    }

    if (await handleAppSettingsRoute(routeRequest)) {
      return;
    }

    if (await handleAgentContentSettingsRoute(routeRequest)) {
      return;
    }

    if (await handleMessageAgentContentSettingsRoute(routeRequest)) {
      return;
    }

    if (await handleOperatorNotificationSettingsRoute(routeRequest)) {
      return;
    }

    if (await handleOperatorNotificationTestRoute(routeRequest)) {
      return;
    }

    if (await handleProductsRoute(routeRequest)) {
      return;
    }

    if (await handleProductStoreRoute(routeRequest)) {
      return;
    }

    if (await handleStoreConnectionsRoute(routeRequest)) {
      return;
    }

    if (await handleConversationsRoute(routeRequest)) {
      return;
    }

    if (await handleMessagesRoute(routeRequest)) {
      return;
    }

    if (await handleMcpPermissionsSettingsRoute(routeRequest)) {
      return;
    }

    if (await handleMcpSettingsRoute(routeRequest)) {
      return;
    }

    if (await handlePostsRoute(routeRequest)) {
      return;
    }

    sendError(res, 404, "Not found");
    return;
  }

  if (req.method === "GET") {
    const legacyRedirect = resolveLegacyAdminRedirect(pathname);
    if (legacyRedirect) {
      res.writeHead(302, { Location: legacyRedirect });
      res.end();
      return;
    }

    if (shouldGateSpaGet(pathname, req.method)) {
      const session = readAdminSession(req);
      if (!session.ok) {
        res.writeHead(302, { Location: "/admin/login" });
        res.end();
        return;
      }
    }

    if (adminVite && !pathname.startsWith("/docs")) {
      await delegateToVite(adminVite, req, res);
      if (res.writableEnded) {
        return;
      }
    }

    serveStatic(pathname, res);
    return;
  }

  sendError(res, 404, "Not found");
}

export function createServer(options: HttpServerOptions = {}): HttpServerHandle {
  const tenancyConfig = options.tenancy ?? readTenancyConfig();
  const db = openDatabase(options.dbPath);

  if (!options.skipMigrations) {
    const applied = runMigrations(db);
    const total = countAppliedMigrations(db);
    if (applied.length > 0) {
      console.log(
        `[iris] migrations applied: ${applied.join(", ")} (total ${total})`,
      );
    } else {
      console.log(`[iris] migrations up to date (${total})`);
    }
  }

  const ctx = createAppContext({
    db,
    adminToken: options.adminToken,
    agentToken: options.agentToken,
    mediaRoot: options.mediaRoot,
    encryptionKey: options.encryptionKey,
    metaAccessToken: options.metaAccessToken,
    igUserId: options.igUserId,
    publicBaseUrl: options.publicBaseUrl,
    publishUrlSecret: options.publishUrlSecret,
    graphApiVersion: options.graphApiVersion,
    metaAppSecret: options.metaAppSecret,
    metaWebhookVerifyToken: options.metaWebhookVerifyToken,
    emailSender: options.emailSender,
    mcpConnectionCode: options.mcpConnectionCode,
  });

  const mcpGateway = new IrisMcpGateway(ctx);
  const tenancy = tenancyConfig.enabled
    ? createTenancyRuntime({
        config: tenancyConfig,
        controlDbPath: options.controlDbPath,
        contextOptions: {
          adminToken: options.adminToken,
          agentToken: options.agentToken,
          encryptionKey: options.encryptionKey,
          metaAccessToken: options.metaAccessToken,
          igUserId: options.igUserId,
          publicBaseUrl: options.publicBaseUrl,
          publishUrlSecret: options.publishUrlSecret,
          graphApiVersion: options.graphApiVersion,
          metaAppSecret: options.metaAppSecret,
          metaWebhookVerifyToken: options.metaWebhookVerifyToken,
          emailSender: options.emailSender,
          mcpConnectionCode: options.mcpConnectionCode,
        },
      })
    : null;

  const stopPublishScheduler = options.startScheduler && !tenancy
    ? startPublishScheduler(ctx, {
        intervalMs: options.publishTickMs,
      })
    : () => undefined;

  const stopCommentResponder = options.startScheduler && !tenancy
    ? startCommentResponder(ctx, {
        intervalMs: options.replyTickMs,
      })
    : () => undefined;

  const stopMessageResponder = options.startScheduler && !tenancy
    ? startMessageResponder(ctx, {
        intervalMs: options.replyTickMs,
      })
    : () => undefined;

  const stopDataRetention = options.startScheduler
    ? startDataRetention(ctx)
    : () => undefined;

  const stopAutoMonitorMedia = options.startScheduler
    ? startAutoMonitorMedia(ctx)
    : () => undefined;

  const stopAccountWorkers = tenancy
    ? startAccountWorkers(() => tenancy.listContexts(), options.publishTickMs)
    : () => undefined;

  const stopScheduler = () => {
    stopPublishScheduler();
    stopCommentResponder();
    stopMessageResponder();
    stopDataRetention();
    stopAutoMonitorMedia();
    stopAccountWorkers();
  };

  let adminVite: ViteDevServer | undefined;

  const server = createHttpServer((req, res) => {
    void handleRequest(req, res, ctx, adminVite, mcpGateway, tenancy).catch(() => {
      sendError(res, 500, "internal server error");
    });
  });

  return {
    server,
    db,
    ctx,
    stopScheduler,
    closeDatabase() {
      tenancy?.close();
      db.close();
    },
    setAdminVite(vite: ViteDevServer) {
      adminVite = vite;
    },
    async closeAdminVite() {
      await adminVite?.close();
      adminVite = undefined;
    },
  };
}

export function getPublicDirectory(): string {
  return PUBLIC_DIR;
}
