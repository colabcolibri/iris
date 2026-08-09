import { createServer as createHttpServer, type Server } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "../adapters/sqlite/connection.ts";
import { runMigrations } from "../adapters/sqlite/migrate.ts";
import { authenticateRequest } from "./auth.ts";
import { createAppContext } from "./app-context.ts";
import { sendError } from "./json.ts";
import { handlePostsRoute } from "./routes/posts.ts";
import { handleAssetsRoute } from "./routes/assets.ts";

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
};

export type HttpServerHandle = {
  server: Server;
  db: DatabaseSync;
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
  options: HttpServerOptions,
  db: DatabaseSync,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const { pathname } = url;

  if (req.method === "GET" && pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (pathname.startsWith("/api/")) {
    const ctx = createAppContext({
      db,
      adminToken: options.adminToken,
      agentToken: options.agentToken,
      mediaRoot: options.mediaRoot,
    });

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

  const server = createHttpServer((req, res) => {
    void handleRequest(req, res, options, db).catch(() => {
      sendError(res, 500, "internal server error");
    });
  });

  return { server, db };
}

export function getPublicDirectory(): string {
  return PUBLIC_DIR;
}
