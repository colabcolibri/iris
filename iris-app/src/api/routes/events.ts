import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthContext } from "../auth.ts";
import { requireAdmin } from "../auth.ts";
import type { AppContext } from "../app-context.ts";
import { sendError } from "../json.ts";
import { eventBus } from "../../adapters/sse/event-bus.ts";

const HEARTBEAT_MS = 25_000;

type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
};

export function handleEventsRoute(request: RouteRequest): boolean {
  const { req, res, auth } = request;
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  if (pathname !== "/api/events" || req.method !== "GET") {
    return false;
  }

  if (!requireAdmin(auth)) {
    sendError(res, 403, "admin token required");
    return true;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  res.write(": connected\n\n");
  eventBus.subscribe(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, HEARTBEAT_MS);

  if (typeof heartbeat.unref === "function") {
    heartbeat.unref();
  }

  res.on("close", () => {
    clearInterval(heartbeat);
  });

  return true;
}
