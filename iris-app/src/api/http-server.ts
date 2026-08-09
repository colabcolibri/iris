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
import { handleAuthRoute } from "./routes/auth.ts";
import { handleMetaAuthRoute } from "./routes/meta-auth.ts";
import { handleMetaRoute } from "./routes/meta.ts";
import { handleSettingsRoute } from "./routes/settings.ts";
import { applyCorsIfNeeded } from "./cors.ts";
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
  ".webmanifest": "application/manifest+json",
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

function sendFile(filePath: string, res: ServerResponse): void {
  const body = readFileSync(filePath);
  const contentType = MIME_TYPES[extname(filePath)] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  res.end(body);
}

function serveStatic(pathname: string, res: ServerResponse): void {
  const filePath = resolvePublicPath(pathname);

  if (!filePath || !existsSync(filePath)) {
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
  return !pathname.startsWith("/api/") && !pathname.startsWith("/auth/meta");
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

  if (await handleMetaAuthRoute(req, res, ctx, pathname)) {
    return;
  }

  if (pathname.startsWith("/api/")) {
    if (applyCorsIfNeeded(req, res)) {
      return;
    }

    if (await handleAuthRoute(req, res, ctx, pathname)) {
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

    if (await handleCommentsRoute(routeRequest)) {
      return;
    }

    if (await handleMetaRoute(routeRequest)) {
      return;
    }

    if (await handleSettingsRoute(routeRequest)) {
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
    emailSender: options.emailSender,
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
