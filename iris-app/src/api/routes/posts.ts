import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthContext } from "../auth.ts";
import { requireAdmin } from "../auth.ts";
import type { AppContext } from "../app-context.ts";
import {
  BodyTooLargeError,
  readJsonBody,
  sendApiError,
  sendError,
  sendJson,
  ValidationError,
} from "../json.ts";
import {
  normalizeCreatePost,
  normalizeUpdatePost,
} from "../../domain/post-mutations.ts";
import { parseIsoDateParam } from "../../domain/datetime-ui.ts";
import { applyScheduleRules } from "../../domain/schedule.ts";
import { assertMetaReadyForSchedule, MetaNotConnectedError } from "../../domain/meta-readiness.ts";
import type { PostStatus } from "../../domain/post.ts";
import { serializePost } from "../../adapters/sqlite/mappers.ts";
import { notifyPostsChanged } from "../../adapters/sse/event-bus.ts";
import { generateCarouselSummaryForPost } from "../../domain/carousel-summary/generate-carousel-summary.ts";

type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
  postId?: string;
};

export async function handlePostsRoute(request: RouteRequest): Promise<boolean> {
  const { req, res, ctx, auth } = request;
  const { pathname, searchParams } = new URL(req.url ?? "/", "http://localhost");

  if (pathname === "/api/posts" && req.method === "GET") {
    try {
      const status = searchParams.get("status") as PostStatus | null;
      const fromRaw = searchParams.get("from");
      const toRaw = searchParams.get("to");
      const from = fromRaw ? parseIsoDateParam(fromRaw, "from") : undefined;
      const to = toRaw ? parseIsoDateParam(toRaw, "to") : undefined;

      const calendarOnly = searchParams.get("calendar_only") === "1";

      const posts = ctx.posts.list({
        status: status ?? undefined,
        from,
        to,
        calendarOnly,
      });
      sendJson(res, 200, { posts: posts.map(serializePost) });
    } catch (error) {
      handlePostsError(res, error);
    }
    return true;
  }

  if (pathname === "/api/posts" && req.method === "POST") {
    try {
      const body = await readJsonBody<Record<string, unknown>>(req);
      const input = normalizeCreatePost(body);
      const post = ctx.posts.create({
        caption: input.caption,
        channel: input.channel,
        scheduledAt: input.scheduledAt,
        sourceNote: input.sourceNote,
        status: input.status,
      });
      notifyPostsChanged({ post_id: post.id });
      sendJson(res, 201, serializePost(post));
    } catch (error) {
      handlePostsError(res, error);
    }
    return true;
  }

  const carouselMatch = /^\/api\/posts\/([^/]+)\/generate-carousel-summary$/.exec(pathname);
  if (carouselMatch && req.method === "POST") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    try {
      const postId = carouselMatch[1];
      const summary = await generateCarouselSummaryForPost(postId, {
        posts: ctx.posts,
        assets: ctx.assets,
        publicBaseUrl: ctx.publicBaseUrl,
        publishUrlSecret: ctx.publishUrlSecret,
        llm: ctx.resolveLlmCompleter(),
      });
      notifyPostsChanged({ post_id: postId });
      sendJson(res, 200, { carousel_summary: summary });
    } catch (error) {
      handlePostsError(res, error);
    }
    return true;
  }

  const match = /^\/api\/posts\/([^/]+)$/.exec(pathname);
  if (!match) {
    return false;
  }

  const postId = match[1];

  if (req.method === "GET") {
    const post = ctx.posts.findById(postId);
    if (!post) {
      sendError(res, 404, "post not found");
      return true;
    }
    sendJson(res, 200, serializePost(post));
    return true;
  }

  if (req.method === "PATCH") {
    try {
      const body = await readJsonBody<Record<string, unknown>>(req);

      if ("auto_reply_enabled" in body && !requireAdmin(auth)) {
        sendError(res, 403, "admin token required");
        return true;
      }

      const update = normalizeUpdatePost(body);
      const current = ctx.posts.findById(postId);
      if (!current) {
        sendError(res, 404, "post not found");
        return true;
      }

      const assetsCount = ctx.assets.listByPostId(postId).length;
      const scheduling =
        update.status === "scheduled" || update.scheduledAt !== undefined;

      const schedule = scheduling
        ? applyScheduleRules({
            currentStatus: current.status,
            nextStatus: update.status,
            scheduledAt:
              update.scheduledAt !== undefined
                ? update.scheduledAt
                : current.scheduledAt,
            assetsCount,
          })
        : {
            status: update.status ?? current.status,
            scheduledAt:
              update.scheduledAt !== undefined
                ? update.scheduledAt
                : current.scheduledAt,
          };

      if (schedule.status === "scheduled") {
        assertMetaReadyForSchedule(ctx);
      }

      const nextStatus = schedule.status;
      const clearError =
        nextStatus === "draft" && current.status === "failed";

      const updated = ctx.posts.update(postId, {
        ...update,
        status: nextStatus,
        scheduledAt: schedule.scheduledAt,
        errorMessage: clearError ? null : undefined,
      });

      notifyPostsChanged({ post_id: postId });
      sendJson(res, 200, serializePost(updated!));
    } catch (error) {
      handlePostsError(res, error);
    }
    return true;
  }

  if (req.method === "DELETE") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    const cancelled = ctx.posts.cancel(postId);
    if (!cancelled) {
      sendError(res, 404, "post not found");
      return true;
    }

    notifyPostsChanged({ post_id: postId });
    sendJson(res, 200, serializePost(cancelled));
    return true;
  }

  return false;
}

function handlePostsError(res: ServerResponse, error: unknown): void {
  if (error instanceof MetaNotConnectedError) {
    sendApiError(res, 422, error.message, error.code);
    return;
  }

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
