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
import { serializeComment } from "../../adapters/sqlite/mappers.ts";
import { notifyCommentsChanged } from "../../adapters/sse/event-bus.ts";
import { buildReplyInspection } from "../../domain/reply-context/build-reply-inspection.ts";
import { buildCommentsInbox, buildLocalCommentsInbox } from "../../domain/comments/build-comments-inbox.ts";
import { listCommentPosts } from "../../domain/comments/list-comment-posts.ts";
import { syncPostComments } from "../../domain/comments/sync-post-comments.ts";
import {
  getMetaReadiness,
  metaReadinessMessage,
} from "../../domain/meta-readiness.ts";
import { serializeReplyContext } from "../../domain/reply-context/serialize-reply-context.ts";
import { assembleReplyContext } from "../../domain/reply-context/reply-context-assembler.ts";
import { registerMonitoredPost } from "../../domain/comments/register-monitored-post.ts";
import { serializePost } from "../../adapters/sqlite/mappers.ts";

function serializeCommentWithDraft(
  comment: Parameters<typeof serializeComment>[0],
  ctx: AppContext,
) {
  const draft = ctx.comments.findLatestDraft(comment.id);
  return {
    ...serializeComment(comment),
    draft_text: draft?.draftText ?? null,
    draft_status: draft?.status ?? null,
  };
}

function requireAdminOrAgent(auth: AuthContext): boolean {
  return auth.role === "admin" || auth.role === "agent";
}

const MAX_REPLY_LENGTH = 2200;

type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
};

export async function handleCommentsRoute(
  request: RouteRequest,
): Promise<boolean> {
  const { req, res, ctx, auth } = request;
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  if (pathname === "/api/comments/posts" && req.method === "GET") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    const posts = listCommentPosts({
      listManagedPosts: () =>
        ctx.posts
          .list()
          .filter((post) =>
            Boolean(post.igMediaId) &&
            (post.status === "published" || post.status === "monitored"),
          )
          .map((post) => ({
            id: post.id,
            caption: post.caption,
            publishedAt: post.publishedAt,
            igMediaId: post.igMediaId,
            status: post.status,
          })),
      countCommentsByPostId: (postId) => ctx.comments.countByPostId(postId),
    });

    sendJson(res, 200, {
      posts: posts.map((post) => {
        const firstAsset = ctx.assets.listByPostId(post.postId)[0];
        return {
          post_id: post.postId,
          caption: post.caption,
          published_at: post.publishedAt,
          ig_media_id: post.igMediaId,
          status: post.status,
          is_external: post.status === "monitored",
          comments_count: post.commentsCount,
          pending_count: post.pendingCount,
          preview_filename: firstAsset?.storagePath ?? null,
          preview_mime: firstAsset?.mime ?? null,
        };
      }),
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

    const postId = insightsMatch[1];
    const post = ctx.posts.findById(postId);
    if (!post) {
      sendError(res, 404, "post not found");
      return true;
    }

    if (!post.igMediaId) {
      sendError(res, 422, "post has no ig_media_id");
      return true;
    }

    let insights: Awaited<ReturnType<typeof ctx.metaInsightsReader.getMediaInsights>> = [];
    let insightsMessage: string | null = null;

    try {
      insights = await ctx.metaInsightsReader.getMediaInsights(post.igMediaId);
    } catch (error) {
      insightsMessage =
        error instanceof Error ? error.message : "Falha ao consultar insights.";
    }

    const assets = ctx.assets.listByPostId(postId);
    let media: Record<string, unknown> | null = null;

    if (assets.length > 0) {
      media = {
        source: "local",
        items: assets.map((asset) => ({
          preview_filename: asset.storagePath,
          preview_mime: asset.mime,
        })),
      };
    } else {
      try {
        const remote = await ctx.metaCommentReader.fetchMediaPreview(post.igMediaId);
        media = {
          source: "meta",
          permalink: remote.permalink ?? null,
          media_type: remote.mediaType ?? null,
          items: remote.slides.map((slide) => ({
            url: slide.url,
            media_type: slide.mediaType,
            thumbnail_url: slide.thumbnailUrl,
          })),
        };
      } catch {
        media = { source: "meta", permalink: null, media_type: null, items: [] };
      }
    }

    sendJson(res, 200, {
      ok: insightsMessage === null,
      code: insightsMessage ? "insights_failed" : undefined,
      message: insightsMessage ?? undefined,
      post_id: postId,
      ig_media_id: post.igMediaId,
      fetched_at: new Date().toISOString(),
      insights,
      media,
    });
    return true;
  }

  if (pathname === "/api/comments/monitored-posts" && req.method === "POST") {
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
      const body = await readJsonBody<{
        ig_media_id?: unknown;
        permalink?: unknown;
      }>(req);
      const post = await registerMonitoredPost(body, {
        posts: ctx.posts,
        metaCommentReader: ctx.metaCommentReader,
      });

      sendJson(res, 201, serializePost(post));
    } catch (error) {
      handleCommentsError(res, error);
    }

    return true;
  }

  if (pathname === "/api/comments/inbox" && req.method === "GET") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    const readiness = getMetaReadiness(ctx);
    if (!readiness.ready) {
      sendError(res, 503, metaReadinessMessage(readiness));
      return true;
    }

    const url = new URL(req.url ?? "/", "http://localhost");
    const daysRaw = Number(url.searchParams.get("days") ?? "30");
    const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 90) : 30;
    const sourceParam = url.searchParams.get("source")?.trim().toLowerCase();
    const source = sourceParam === "meta" ? "meta" : "local";
    const scopeParam = url.searchParams.get("scope")?.trim().toLowerCase();
    const scope = scopeParam === "all" ? "all" : "iris";
    const igMediaIdParam = url.searchParams.get("ig_media_id")?.trim() || undefined;
    const postIdParam = url.searchParams.get("post_id")?.trim() || undefined;

    let igMediaId = igMediaIdParam;
    if (!igMediaId && postIdParam) {
      const post = ctx.posts.findById(postIdParam);
      if (!post) {
        sendError(res, 404, "post not found");
        return true;
      }
      if (!post.igMediaId) {
        sendError(res, 422, "post has no ig_media_id");
        return true;
      }
      igMediaId = post.igMediaId;
    }

    const inboxDeps = {
      metaCommentReader: ctx.metaCommentReader,
      findPostIdByIgMediaId: (mediaId: string) => ctx.posts.findByIgMediaId(mediaId)?.id ?? null,
      listIrisPostsSince: (since: Date) =>
        ctx.posts
          .list({ from: since.toISOString(), calendarOnly: true })
          .filter((post) => post.igMediaId && post.status === "published")
          .map((post) => ({
            id: post.id,
            igMediaId: post.igMediaId!,
            caption: post.caption,
            publishedAt: post.publishedAt,
            scheduledAt: post.scheduledAt,
          })),
      listCommentsByPostId: (postId: string) =>
        ctx.comments.listByPostId(postId).map((comment) => ({
          id: comment.id,
          igCommentId: comment.igCommentId,
          parentIgCommentId: comment.parentIgCommentId,
          authorUsername: comment.authorUsername,
          text: comment.text,
          status: comment.status,
          createdAt: comment.createdAt,
        })),
      upsertFromWebhook: (input: Parameters<typeof ctx.comments.upsertFromWebhook>[0]) =>
        ctx.comments.upsertFromWebhook(input),
      findByIgCommentId: (igCommentId: string) => ctx.comments.findByIgCommentId(igCommentId),
    };

    try {
      const inbox =
        source === "local"
          ? buildLocalCommentsInbox(days, inboxDeps, { igMediaId })
          : await buildCommentsInbox(days, inboxDeps, { igMediaId, scope });

      sendJson(res, 200, {
        source: inbox.source,
        synced_at: inbox.syncedAt,
        days: inbox.days,
        summary: inbox.summary,
        media: inbox.media.map((item) => ({
          ig_media_id: item.igMediaId,
          post_id: item.postId,
          caption: item.caption,
          media_timestamp: item.mediaTimestamp,
          reported_comments_count: item.reportedCommentsCount,
          comments: item.comments.map((comment) => ({
            ig_comment_id: comment.igCommentId,
            parent_ig_comment_id: comment.parentIgCommentId,
            author_username: comment.authorUsername,
            text: comment.text,
            timestamp: comment.timestamp,
            iris_comment_id: comment.irisCommentId,
            status: comment.status,
          })),
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed to sync comments";
      sendError(res, 502, message);
    }

    return true;
  }

  const syncMatch = /^\/api\/posts\/([^/]+)\/comments\/sync$/.exec(pathname);
  if (syncMatch && req.method === "POST") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    const postId = syncMatch[1];
    const post = ctx.posts.findById(postId);
    if (!post) {
      sendError(res, 404, "post not found");
      return true;
    }

    if (!post.igMediaId) {
      sendError(res, 422, "post has no ig_media_id");
      return true;
    }

    const readiness = getMetaReadiness(ctx);
    if (!readiness.ready) {
      sendError(res, 503, metaReadinessMessage(readiness));
      return true;
    }

    try {
      const result = await syncPostComments(
        { postId, igMediaId: post.igMediaId },
        {
          metaCommentReader: ctx.metaCommentReader,
          upsertFromWebhook: (input) => ctx.comments.upsertFromWebhook(input),
        },
      );

      notifyCommentsChanged({ post_id: postId });

      sendJson(res, 200, {
        post_id: result.postId,
        ig_media_id: result.igMediaId,
        synced_at: result.syncedAt,
        reported_comments_count: result.reportedCommentsCount,
        comments_fetched: result.commentsFetched,
        access_limited: result.accessLimited,
        warning: result.warning,
        comments: result.comments.map((comment) =>
          serializeCommentWithDraft(comment, ctx),
        ),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed to sync comments";
      sendError(res, 502, message);
    }

    return true;
  }

  const listMatch = /^\/api\/posts\/([^/]+)\/comments$/.exec(pathname);
  if (listMatch && req.method === "GET") {
    const postId = listMatch[1];
    const post = ctx.posts.findById(postId);
    if (!post) {
      sendError(res, 404, "post not found");
      return true;
    }

    const comments = ctx.comments.listByPostId(postId);
    sendJson(res, 200, {
      comments: comments.map((comment) => serializeCommentWithDraft(comment, ctx)),
    });
    return true;
  }

  const inspectionMatch = /^\/api\/posts\/([^/]+)\/reply-inspection$/.exec(pathname);
  if (inspectionMatch && req.method === "GET") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    const postId = inspectionMatch[1];
    const inspection = buildReplyInspection(postId, ctx.replyContextAssembler);

    if (!inspection) {
      sendError(res, 404, "post not found");
      return true;
    }

    sendJson(res, 200, inspection);
    return true;
  }

  const replyContextMatch = /^\/api\/comments\/([^/]+)\/reply-context$/.exec(pathname);
  if (replyContextMatch && req.method === "GET") {
    if (!requireAdminOrAgent(auth)) {
      sendError(res, 403, "admin or agent token required");
      return true;
    }

    const commentId = replyContextMatch[1];
    const comment = ctx.comments.findById(commentId);
    if (!comment) {
      sendError(res, 404, "comment not found");
      return true;
    }

    const context = await assembleReplyContext(commentId, ctx.replyContextAssembler);
    if (!context) {
      sendError(res, 404, "comment not found");
      return true;
    }

    const post = ctx.posts.findById(comment.postId);
    sendJson(
      res,
      200,
      serializeReplyContext(context, {
        commentId: comment.id,
        igCommentId: comment.igCommentId,
        postId: comment.postId,
        igMediaId: post?.igMediaId ?? null,
      }),
    );
    return true;
  }

  const approveReplyMatch = /^\/api\/comments\/([^/]+)\/approve-reply$/.exec(pathname);
  if (approveReplyMatch && req.method === "POST") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    try {
      const commentId = approveReplyMatch[1];
      const comment = ctx.comments.findById(commentId);
      if (!comment) {
        sendError(res, 404, "comment not found");
        return true;
      }

      if (comment.status === "replied") {
        sendJson(res, 200, serializeCommentWithDraft(comment, ctx));
        return true;
      }

      if (comment.status !== "pending") {
        sendError(res, 422, "only pending comments can be approved");
        return true;
      }

      const body = await readJsonBody<{ message?: unknown }>(req);
      const draft = ctx.comments.findLatestDraft(commentId);
      const message =
        typeof body.message === "string" && body.message.trim()
          ? body.message.trim()
          : draft?.draftText?.trim() ?? "";

      if (!message) {
        throw new ValidationError("message or draft is required");
      }

      if (message.length > MAX_REPLY_LENGTH) {
        throw new ValidationError(`message must be at most ${MAX_REPLY_LENGTH} characters`);
      }

      const readiness = getMetaReadiness(ctx);
      if (!readiness.ready) {
        sendError(res, 503, metaReadinessMessage(readiness));
        return true;
      }

      try {
        await ctx.metaCommentReplier.reply(comment.igCommentId, message);
        if (!ctx.comments.promoteDraftToSent(commentId, message)) {
          ctx.comments.createReply({
            commentId,
            sentText: message,
            status: "sent",
          });
        }
        const updated = ctx.comments.markReplied(commentId);
        notifyCommentsChanged({ post_id: comment.postId });
        sendJson(res, 200, serializeCommentWithDraft(updated!, ctx));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "reply failed";
        ctx.comments.createReply({
          commentId,
          sentText: message,
          status: "failed",
        });
        const updated = ctx.comments.markFailed(commentId, errorMessage);
        notifyCommentsChanged({ post_id: comment.postId });
        sendJson(res, 200, serializeCommentWithDraft(updated!, ctx));
      }
    } catch (error) {
      handleCommentsError(res, error);
    }

    return true;
  }

  const replyMatch = /^\/api\/comments\/([^/]+)\/reply$/.exec(pathname);
  if (replyMatch && req.method === "POST") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    try {
      const commentId = replyMatch[1];
      const comment = ctx.comments.findById(commentId);
      if (!comment) {
        sendError(res, 404, "comment not found");
        return true;
      }

      if (comment.status !== "pending") {
        sendError(res, 422, "only pending comments can be replied");
        return true;
      }

      const body = await readJsonBody<{ message?: unknown }>(req);
      const message = typeof body.message === "string" ? body.message.trim() : "";

      if (!message) {
        throw new ValidationError("message is required");
      }

      if (message.length > MAX_REPLY_LENGTH) {
        throw new ValidationError(`message must be at most ${MAX_REPLY_LENGTH} characters`);
      }

      const readiness = getMetaReadiness(ctx);
      if (!readiness.ready) {
        sendError(res, 503, metaReadinessMessage(readiness));
        return true;
      }

      try {
        await ctx.metaCommentReplier.reply(comment.igCommentId, message);
        ctx.comments.createReply({ commentId, sentText: message, status: "sent" });
        const updated = ctx.comments.markReplied(commentId);
        notifyCommentsChanged({ post_id: comment.postId });
        sendJson(res, 200, serializeCommentWithDraft(updated!, ctx));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "reply failed";
        ctx.comments.createReply({ commentId, sentText: message, status: "failed" });
        const updated = ctx.comments.markFailed(commentId, errorMessage);
        notifyCommentsChanged({ post_id: comment.postId });
        sendJson(res, 200, serializeCommentWithDraft(updated!, ctx));
      }
    } catch (error) {
      handleCommentsError(res, error);
    }

    return true;
  }

  return false;
}

function handleCommentsError(res: ServerResponse, error: unknown): void {
  if (error instanceof ValidationError) {
    sendError(res, 422, error.message);
    return;
  }

  if (error instanceof BodyTooLargeError) {
    sendError(res, 413, error.message);
    return;
  }

  if (error instanceof Error && error.message.trim()) {
    sendError(res, 502, error.message);
    return;
  }

  sendError(res, 500, "internal server error");
}
