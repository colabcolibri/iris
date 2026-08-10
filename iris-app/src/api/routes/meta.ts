import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthContext } from "../auth.ts";
import { requireAdmin } from "../auth.ts";
import type { AppContext } from "../app-context.ts";
import { sendError, sendJson } from "../json.ts";
import { checkMetaConnection } from "../../adapters/meta/meta-health-check.ts";
import {
  getMetaReadiness,
  metaReadinessMessage,
} from "../../domain/meta-readiness.ts";

type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
};

export async function handleMetaRoute(request: RouteRequest): Promise<boolean> {
  const { req, res, ctx, auth } = request;
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  if (!pathname.startsWith("/api/meta/")) {
    return false;
  }

  if (!requireAdmin(auth)) {
    sendError(res, 403, "Admin access required");
    return true;
  }

  if (req.method === "POST" && pathname === "/api/meta/disconnect") {
    ctx.metaTokenStore.clear();
    ctx.metaConnectionStore.clear();
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (req.method !== "GET") {
    sendError(res, 405, "Method not allowed");
    return true;
  }

  if (pathname === "/api/meta/status") {
    const token = ctx.metaTokenStore.getActiveToken();
    const connection = ctx.metaConnectionStore.get();
    const tokenRow = ctx.db
      .prepare("SELECT expires_at FROM meta_tokens ORDER BY updated_at DESC LIMIT 1")
      .get() as { expires_at: string | null } | undefined;

    const tokenExpiresAt = tokenRow?.expires_at ?? null;
    const tokenExpired =
      tokenExpiresAt !== null && Date.parse(tokenExpiresAt) < Date.now();

    const connected =
      Boolean(token) && Boolean(connection?.igUserId) && !tokenExpired;

    sendJson(res, 200, {
      connected,
      igUsername: connection?.igUsername ?? null,
      igUserId: connection?.igUserId ?? null,
      pageName: connection?.pageName ?? null,
      tokenExpiresAt,
      tokenExpired,
    });
    return true;
  }

  if (pathname === "/api/meta/health") {
    const token = ctx.metaTokenStore.getActiveToken();
    const connection = ctx.metaConnectionStore.get();

    if (!token || !connection?.igUserId) {
      sendJson(res, 200, {
        ok: false,
        code: "not_connected",
        message: "Instagram não conectado.",
      });
      return true;
    }

    const result = await checkMetaConnection({
      igUserId: connection.igUserId,
      token,
      graphApiVersion: ctx.graphApiVersion,
    });

    sendJson(res, 200, result);
    return true;
  }

  if (pathname === "/api/meta/media/browse") {
    const readiness = getMetaReadiness(ctx);
    if (!readiness.ready) {
      sendError(res, 503, metaReadinessMessage(readiness));
      return true;
    }

    const url = new URL(req.url ?? "/", "http://localhost");
    const limitRaw = Number(url.searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitRaw) ? limitRaw : 20;
    const after = url.searchParams.get("after")?.trim() || null;

    try {
      const page = await ctx.metaCommentReader.listBrowsableMedia({ limit, after });
      sendJson(res, 200, {
        items: page.items.map((item) => {
          const existing = ctx.posts.findByIgMediaId(item.igMediaId);
          const alreadyManaged = Boolean(
            existing &&
              (existing.status === "monitored" || existing.status === "published"),
          );

          return {
            ig_media_id: item.igMediaId,
            caption: item.caption,
            published_at: item.timestamp,
            permalink: item.permalink,
            media_type: item.mediaType,
            thumbnail_url: item.thumbnailUrl,
            like_count: item.likeCount,
            comments_count: item.commentsCount,
            already_managed: alreadyManaged,
            managed_post_id: alreadyManaged ? existing?.id ?? null : null,
          };
        }),
        next_cursor: page.nextCursor,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed to browse media";
      sendError(res, 502, message);
    }

    return true;
  }

  sendError(res, 404, "Not found");
  return true;
}
