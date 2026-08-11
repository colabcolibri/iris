import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthContext } from "../auth.ts";
import { requireAdmin } from "../auth.ts";
import type { AppContext } from "../app-context.ts";
import {
  BodyTooLargeError,
  readJsonBody,
  sendError,
  sendJson,
  ValidationError,
} from "../json.ts";
import {
  getMetaReadiness,
  metaReadinessMessage,
} from "../../domain/meta-readiness.ts";
import { fetchPostInsights } from "../../domain/insights/fetch-post-insights.ts";
import { refreshAllPostInsights } from "../../domain/insights/refresh-all-post-insights.ts";
import { serializePostInsightsSnapshot } from "../../domain/insights/post-insights-response.ts";

type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
};

function handleInsightsError(res: ServerResponse, error: unknown): void {
  if (error instanceof ValidationError) {
    sendError(res, 422, error.message);
    return;
  }

  if (error instanceof BodyTooLargeError) {
    sendError(res, 413, error.message);
    return;
  }

  sendError(res, 500, "internal server error");
}

export async function handleInsightsRoute(request: RouteRequest): Promise<boolean> {
  const { req, res, ctx, auth } = request;
  const { pathname, searchParams } = new URL(req.url ?? "/", "http://localhost");

  if (pathname === "/api/insights/refresh-all" && req.method === "POST") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    const readiness = getMetaReadiness(ctx);
    if (!readiness.ready) {
      sendError(res, 503, metaReadinessMessage(readiness));
      return true;
    }

    try {
      const body = await readJsonBody<Record<string, unknown>>(req).catch(() => ({}));
      const limit =
        typeof body.limit === "number"
          ? body.limit
          : typeof body.limit === "string"
            ? Number(body.limit)
            : undefined;
      const delayMs =
        typeof body.delay_ms === "number"
          ? body.delay_ms
          : typeof body.delay_ms === "string"
            ? Number(body.delay_ms)
            : undefined;
      const force = body.force === undefined ? true : Boolean(body.force);

      const result = await refreshAllPostInsights(ctx, {
        limit: Number.isFinite(limit) ? limit : undefined,
        delayMs: Number.isFinite(delayMs) ? delayMs : undefined,
        force,
      });

      sendJson(res, 200, result);
    } catch (error) {
      handleInsightsError(res, error);
    }

    return true;
  }

  const historyMatch = /^\/api\/posts\/([^/]+)\/insights\/history$/.exec(pathname);
  if (historyMatch && req.method === "GET") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    const postId = historyMatch[1];
    const post = ctx.posts.findById(postId);
    if (!post) {
      sendError(res, 404, "post not found");
      return true;
    }

    const limitRaw = Number(searchParams.get("limit") ?? "30");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 30;
    const snapshots = ctx.postInsightsStore.listByPostId(postId, limit);

    sendJson(res, 200, {
      post_id: postId,
      ig_media_id: post.igMediaId,
      snapshots: snapshots.map((snapshot) =>
        serializePostInsightsSnapshot(snapshot, { fromCache: true }),
      ),
    });
    return true;
  }

  const insightsMatch = /^\/api\/posts\/([^/]+)\/insights$/.exec(pathname);
  if (insightsMatch && req.method === "GET") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    const readiness = getMetaReadiness(ctx);
    if (!readiness.ready) {
      sendError(res, 503, metaReadinessMessage(readiness));
      return true;
    }

    try {
      const postId = insightsMatch[1];
      const force =
        searchParams.get("force") === "1" || searchParams.get("refresh") === "1";
      const result = await fetchPostInsights(ctx, postId, { force });
      sendJson(res, 200, result);
    } catch (error) {
      if (error instanceof ValidationError && error.message === "post not found") {
        sendError(res, 404, error.message);
        return true;
      }
      handleInsightsError(res, error);
    }

    return true;
  }

  return false;
}
