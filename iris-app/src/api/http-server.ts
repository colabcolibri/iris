import { createServer as createHttpServer, type Server } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import { openDatabase } from "../adapters/sqlite/connection.ts";
import { runMigrations } from "../adapters/sqlite/migrate.ts";

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
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const body = readFileSync(filePath);
  const contentType = MIME_TYPES[extname(filePath)] ?? "application/octet-stream";

  res.writeHead(200, { "Content-Type": contentType });
  res.end(body);
}

function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  const { pathname } = url;

  if (req.method === "GET" && pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "GET") {
    serveStatic(pathname, res);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
}

export function createServer(options: HttpServerOptions = {}): Server {
  if (!options.skipMigrations) {
    const db = openDatabase(options.dbPath);
    try {
      runMigrations(db);
    } finally {
      db.close();
    }
  }

  return createHttpServer(handleRequest);
}

export function getPublicDirectory(): string {
  return PUBLIC_DIR;
}
