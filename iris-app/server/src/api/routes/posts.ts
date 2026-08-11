import { requireAdmin } from "../auth.ts";
import { readJsonBody, sendError, sendJson } from "../json.ts";
import { createRouter, route } from "../router.ts";
import { requirePost, routeParam } from "../route-resources.ts";
import {
  normalizeCreatePost,
  normalizeUpdatePost,
} from "../../domain/posts/post-mutations.ts";
import { parseIsoDateParam } from "../../domain/time/datetime-ui.ts";
import { applyScheduleRules } from "../../domain/posts/schedule.ts";
import { assertMetaReadyForSchedule } from "../../domain/meta/meta-readiness.ts";
import type { PostStatus } from "../../domain/posts/post.ts";
import { serializePost } from "../../adapters/sqlite/mappers.ts";
import { notifyPostsChanged } from "../../adapters/sse/event-bus.ts";
import { generateCarouselSummaryForPost } from "../../domain/carousel-summary/generate-carousel-summary.ts";
import { publishPostNow } from "../../domain/posts/publish-post.ts";
import { enqueueSchedulablePendingComments } from "../../domain/comments/enqueue-schedulable-pending-comments.ts";

export const handlePostsRoute = createRouter([
  route("GET", "/api/posts", async (match) => {
    const status = match.searchParams.get("status") as PostStatus | null;
    const fromRaw = match.searchParams.get("from");
    const toRaw = match.searchParams.get("to");
    const from = fromRaw ? parseIsoDateParam(fromRaw, "from") : undefined;
    const to = toRaw ? parseIsoDateParam(toRaw, "to") : undefined;
    const calendarOnly = match.searchParams.get("calendar_only") === "1";

    const posts = match.ctx.posts.list({
      status: status ?? undefined,
      from,
      to,
      calendarOnly,
    });
    sendJson(match.res, 200, { posts: posts.map(serializePost) });
  }),

  route("POST", "/api/posts", async (match) => {
    const body = await readJsonBody<Record<string, unknown>>(match.req);
    const input = normalizeCreatePost(body);
    const post = match.ctx.posts.create({
      caption: input.caption,
      channel: input.channel,
      scheduledAt: input.scheduledAt,
      sourceNote: input.sourceNote,
      status: input.status,
    });
    notifyPostsChanged({ post_id: post.id });
    sendJson(match.res, 201, serializePost(post));
  }),

  route(
    "POST",
    /^\/api\/posts\/([^/]+)\/generate-carousel-summary$/,
    { admin: true },
    async (match) => {
      const postId = routeParam(match, "postId");
      const llmConfig = match.ctx.llmConfigResolver.resolve();
      const persona = match.ctx.replyPersonaStore.get();
      const summary = await generateCarouselSummaryForPost(postId, {
        posts: match.ctx.posts,
        assets: match.ctx.assets,
        metaCommentReader: match.ctx.metaCommentReader,
        publicBaseUrl: match.ctx.publicBaseUrl,
        publishUrlSecret: match.ctx.publishUrlSecret,
        mediaStorage: match.ctx.mediaStorage,
        llm: match.ctx.resolveLlmCompleter(),
        responseLanguage: persona?.responseLanguage,
        visionEnabled: llmConfig?.supportsVision ?? false,
      });
      notifyPostsChanged({ post_id: postId });
      sendJson(match.res, 200, { carousel_summary: summary });
    },
    { paramNames: ["postId"] },
  ),

  route(
    "POST",
    /^\/api\/posts\/([^/]+)\/publish$/,
    async (match) => {
      const postId = routeParam(match, "postId");
      if (!requirePost(match, postId)) {
        return;
      }

      const updated = await publishPostNow(match.ctx, postId);
      sendJson(match.res, 200, serializePost(updated));
    },
    { paramNames: ["postId"] },
  ),

  route(
    "GET",
    /^\/api\/posts\/([^/]+)$/,
    async (match) => {
      const postId = routeParam(match, "postId");
      const post = requirePost(match, postId);
      if (!post) {
        return;
      }
      sendJson(match.res, 200, serializePost(post));
    },
    { paramNames: ["postId"] },
  ),

  route(
    "PATCH",
    /^\/api\/posts\/([^/]+)$/,
    async (match) => {
      const postId = routeParam(match, "postId");
      const body = await readJsonBody<Record<string, unknown>>(match.req);

      if ("auto_reply_enabled" in body && !requireAdmin(match.auth)) {
        sendError(match.res, 403, "admin token required");
        return;
      }

      const update = normalizeUpdatePost(body);
      const current = requirePost(match, postId);
      if (!current) {
        return;
      }

      const assetsCount = match.ctx.assets.listByPostId(postId).length;
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
        assertMetaReadyForSchedule(match.ctx);
      }

      const nextStatus = schedule.status;
      const clearError = nextStatus === "draft" && current.status === "failed";

      const updated = match.ctx.posts.update(postId, {
        ...update,
        status: nextStatus,
        scheduledAt: schedule.scheduledAt,
        errorMessage: clearError ? null : undefined,
      });

      if (
        update.replyMode !== undefined ||
        update.autoReplyEnabled !== undefined
      ) {
        enqueueSchedulablePendingComments(match.ctx, { postId });
      }

      notifyPostsChanged({ post_id: postId });
      sendJson(match.res, 200, serializePost(updated!));
    },
    { paramNames: ["postId"] },
  ),

  route(
    "DELETE",
    /^\/api\/posts\/([^/]+)$/,
    { admin: true },
    async (match) => {
      const postId = routeParam(match, "postId");
      const cancelled = match.ctx.posts.cancel(postId);
      if (!cancelled) {
        sendError(match.res, 404, "post not found");
        return;
      }

      notifyPostsChanged({ post_id: postId });
      sendJson(match.res, 200, serializePost(cancelled));
    },
    { paramNames: ["postId"] },
  ),
]);
