import { createServer as createHttpServer, type Server } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "../adapters/sqlite/connection.ts";
import { runMigrations } from "../adapters/sqlite/migrate.ts";
import { authenticateRequest } from "./auth.ts";
import { createAppContext, type AppContext } from "./app-context.ts";
import { sendError } from "./json.ts";
import { handlePostsRoute } from "./routes/posts.ts";
import { handleAssetsRoute } from "./routes/assets.ts";
import { handleEventsRoute } from "./routes/events.ts";
import { handlePublishMediaRoute } from "./routes/publish-media.ts";
import { handleMetaWebhookRoute } from "./routes/meta-webhook.ts";
import { handleCommentsRoute } from "./routes/comments.ts";
import { startPublishScheduler } from "../workers/publish-scheduler.ts";
import { startCommentResponder } from "../workers/comment-responder.ts";

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const PUBLIC_DIR = join(PROJECT_ROOT, "public");

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
  ".ico": "image/x-icon",
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
  startScheduler?: boolean;
  publishTickMs?: number;
  replyTickMs?: number;
};

export type HttpServerHandle = {
  server: Server;
  db: DatabaseSync;
  ctx: AppContext;
  stopScheduler: () => void;
};

function resolvePublicPath(pathname: string): string | null {
  const relativePath = pathname === "/" ? "/index.html" : pathname;
  const safePath = normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  const absolutePath = join(PUBLIC_DIR, safePath);

  if (!absolutePath.startsWith(PUBLIC_DIR)) {
    return null;
  }

  return absolutePath;
}

function serveStatic(pathname: string, res: ServerResponse): void {
  const filePath = resolvePublicPath(pathname);

  if (!filePath || !existsSync(filePath)) {
    sendError(res, 404, "Not found");
    return;
  }

  const body = readFileSync(filePath);
  const contentType = MIME_TYPES[extname(filePath)] ?? "application/octet-stream";

  res.writeHead(200, { "Content-Type": contentType });
  res.end(body);
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const { pathname } = url;

  if (req.method === "GET" && pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (handlePublishMediaRoute(req, res, ctx, pathname)) {
    return;
  }

  if (await handleMetaWebhookRoute(req, res, ctx, pathname)) {
    return;
  }

  if (pathname.startsWith("/api/")) {
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

    if (await handleCommentsRoute(routeRequest)) {
      return;
    }

    if (await handlePostsRoute(routeRequest)) {
      return;
    }

    sendError(res, 404, "Not found");
    return;
  }

  if (req.method === "GET") {
    serveStatic(pathname, res);
    return;
  }

  sendError(res, 404, "Not found");
}

export function createServer(options: HttpServerOptions = {}): HttpServerHandle {
  const db = openDatabase(options.dbPath);

  if (!options.skipMigrations) {
    runMigrations(db);
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
  });

  const stopPublishScheduler = options.startScheduler
    ? startPublishScheduler(ctx, {
        intervalMs: options.publishTickMs,
      })
    : () => undefined;

  const stopCommentResponder = options.startScheduler
    ? startCommentResponder(ctx, {
        intervalMs: options.replyTickMs,
      })
    : () => undefined;

  const stopScheduler = () => {
    stopPublishScheduler();
    stopCommentResponder();
  };

  const server = createHttpServer((req, res) => {
    void handleRequest(req, res, ctx).catch(() => {
      sendError(res, 500, "internal server error");
    });
  });

  return { server, db, ctx, stopScheduler };
}

export function getPublicDirectory(): string {
  return PUBLIC_DIR;
}
