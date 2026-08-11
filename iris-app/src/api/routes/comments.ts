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
import { serializeComment, serializePost } from "../../adapters/sqlite/mappers.ts";
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
import { serializeReplyAudit } from "../../domain/reply-audit/serialize-reply-audit.ts";
import { registerMonitoredPost } from "../../domain/comments/register-monitored-post.ts";
import { registerMonitoredPostsBatch } from "../../domain/comments/register-monitored-posts-batch.ts";
import {
  firstPostMediaUrl,
  resolvePostMedia,
} from "../../domain/post-media/resolve-post-media.ts";
import { serializePostMedia } from "../../domain/post-media/serialize-post-media.ts";
import {
  planCommentThreadReconciliation,
  reconcileCommentThreadStatuses,
} from "../../domain/comments/reconcile-comment-thread-statuses.ts";
import {
  requestManualCommentReply,
} from "../../domain/comments/request-manual-comment-reply.ts";

function brandUsername(ctx: AppContext): string | null {
  return ctx.metaConnectionStore.get()?.igUsername ?? null;
}

function commentReconcileDeps(ctx: AppContext) {
  return {
    listByPostId: ctx.comments.listByPostId,
    hasReplyRecord: ctx.comments.hasReplyRecord,
    linkInstagramReply: (input: {
      userCommentId: string;
      brandIgCommentId: string;
      sentText: string | null;
    }) => ctx.comments.linkInstagramReply(input),
    markSkipped: ctx.comments.markSkipped,
  };
}

function serializeCommentWithDraft(
  comment: Parameters<typeof serializeComment>[0],
  ctx: AppContext,
) {
  const draft = ctx.comments.findLatestDraft(comment.id);
  const sent = ctx.comments.findLatestSentReply(comment.id);
  return {
    ...serializeComment(comment),
    draft_text: draft?.draftText ?? null,
    draft_status: draft?.status ?? null,
    linked_reply_text: sent?.sentText ?? null,
    linked_reply_ig_comment_id: sent?.sourceIgCommentId ?? null,
    reply_to_ig_comment_id: sent?.replyToIgCommentId ?? null,
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
            carouselSummary: post.carouselSummary,
            publishedAt: post.publishedAt,
            igMediaId: post.igMediaId,
            status: post.status,
          })),
      countCommentsByPostId: (postId) => ctx.comments.countByPostId(postId),
    });

    sendJson(res, 200, {
      posts: await Promise.all(
        posts.map(async (post) => {
          const firstAsset = ctx.assets.listByPostId(post.postId)[0];
          let previewUrl: string | null = firstAsset
            ? `/api/posts/${post.postId}/assets/${encodeURIComponent(firstAsset.storagePath)}`
            : null;

          if (!previewUrl && post.igMediaId && getMetaReadiness(ctx).ready) {
            const media = await resolvePostMedia(post.postId, {
              posts: ctx.posts,
              assets: ctx.assets,
              metaCommentReader: ctx.metaCommentReader,
              publicBaseUrl: ctx.publicBaseUrl,
              publishUrlSecret: ctx.publishUrlSecret,
            });
            previewUrl = firstPostMediaUrl(media);
          }

          return {
            post_id: post.postId,
            caption: post.caption,
            carousel_summary: post.carouselSummary ?? null,
            published_at: post.publishedAt,
            ig_media_id: post.igMediaId,
            status: post.status,
            is_external: post.status === "monitored",
            comments_count: post.commentsCount,
            pending_count: post.pendingCount,
            preview_filename: firstAsset?.storagePath ?? null,
            preview_mime: firstAsset?.mime ?? null,
            preview_url: previewUrl,
          };
        }),
      ),
    });
    return true;
  }

  const insightsMatch = /^\/api\/posts\/([^/]+)\/insights$/.exec(pathname);
  if (insightsMatch) {
    return false;
  }

  if (pathname === "/api/comments/monitored-posts/batch" && req.method === "POST") {
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
      const body = await readJsonBody<{ ig_media_ids?: unknown }>(req);
      const result = await registerMonitoredPostsBatch(body.ig_media_ids, {
        posts: ctx.posts,
        metaCommentReader: ctx.metaCommentReader,
      });

      sendJson(res, 201, {
        imported: result.imported.map(serializePost),
        skipped: result.skipped,
      });
    } catch (error) {
      handleCommentsError(res, error);
    }

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

  const reconcilePreviewMatch = /^\/api\/posts\/([^/]+)\/comments\/reconcile-preview$/.exec(
    pathname,
  );
  if (reconcilePreviewMatch && req.method === "GET") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    const postId = reconcilePreviewMatch[1];
    const post = ctx.posts.findById(postId);
    if (!post) {
      sendError(res, 404, "post not found");
      return true;
    }

    const brand = brandUsername(ctx);
    const plan = planCommentThreadReconciliation(
      postId,
      brand,
      ctx.comments.listByPostId,
      ctx.comments.hasReplyRecord,
    );

    sendJson(res, 200, {
      post_id: postId,
      brand_username: brand,
      linkable_count: plan.links.length,
      skipped_brand_count: plan.skippedBrandCommentIds.length,
      links: plan.links.map((link) => ({
        user_comment_id: link.userCommentId,
        brand_ig_comment_id: link.brandIgCommentId,
        preview_text: link.sentText,
      })),
    });
    return true;
  }

  const reconcileMatch = /^\/api\/posts\/([^/]+)\/comments\/reconcile$/.exec(pathname);
  if (reconcileMatch && req.method === "POST") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    const postId = reconcileMatch[1];
    const post = ctx.posts.findById(postId);
    if (!post) {
      sendError(res, 404, "post not found");
      return true;
    }

    const brand = brandUsername(ctx);
    const result = reconcileCommentThreadStatuses(
      postId,
      brand,
      commentReconcileDeps(ctx),
    );

    notifyCommentsChanged({ post_id: postId });

    sendJson(res, 200, {
      post_id: postId,
      brand_username: brand,
      linked_count: result.linkedCount,
      skipped_brand_count: result.skippedBrandCount,
      linkable_count: result.plan.links.length,
      comments: ctx.comments.listByPostId(postId).map((comment) =>
        serializeCommentWithDraft(comment, ctx),
      ),
    });
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
          listByPostId: (id) => ctx.comments.listByPostId(id),
          markDeletedFromInstagram: (id) =>
            ctx.comments.markDeletedFromInstagram(id),
          restoreFromInstagram: (id) => ctx.comments.restoreFromInstagram(id),
        },
      );

      reconcileCommentThreadStatuses(postId, brandUsername(ctx), commentReconcileDeps(ctx));

      const comments = ctx.comments.listByPostId(postId);

      notifyCommentsChanged({ post_id: postId });

      sendJson(res, 200, {
        post_id: result.postId,
        ig_media_id: result.igMediaId,
        synced_at: result.syncedAt,
        reported_comments_count: result.reportedCommentsCount,
        comments_fetched: result.commentsFetched,
        access_limited: result.accessLimited,
        warning: result.warning,
        marked_deleted: result.markedDeleted,
        restored: result.restored,
        comments: comments.map((comment) =>
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

  const replyAuditMatch = /^\/api\/comments\/([^/]+)\/reply-audit$/.exec(pathname);
  if (replyAuditMatch && req.method === "GET") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    const commentId = replyAuditMatch[1];
    const comment = ctx.comments.findById(commentId);
    if (!comment) {
      sendError(res, 404, "comment not found");
      return true;
    }

    const steps = ctx.agentRunSteps.listByCommentId(commentId);
    if (steps.length === 0) {
      sendError(res, 404, "no agent run for comment");
      return true;
    }

    const agentRunId = ctx.agentRunSteps.findLatestRunIdByCommentId(commentId);
    if (!agentRunId) {
      sendError(res, 404, "no agent run for comment");
      return true;
    }

    const run = ctx.agentRuns.findById(agentRunId);
    if (!run) {
      sendError(res, 404, "no agent run for comment");
      return true;
    }

    sendJson(res, 200, serializeReplyAudit(run, steps));
    return true;
  }

  const aiReplyMatch = /^\/api\/comments\/([^/]+)\/ai-reply$/.exec(pathname);
  if (aiReplyMatch && req.method === "POST") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    try {
      const commentId = aiReplyMatch[1];
      const comment = ctx.comments.findById(commentId);
      if (!comment) {
        sendError(res, 404, "comment not found");
        return true;
      }

      if (comment.deletedAt) {
        sendError(res, 410, "comment was removed from instagram");
        return true;
      }

      const body = await readJsonBody<{ mode?: unknown }>(req);
      const mode = body.mode;
      if (mode !== "auto" && mode !== "draft") {
        throw new ValidationError('mode must be "auto" or "draft"');
      }

      await requestManualCommentReply(
        ctx,
        commentId,
        mode,
        {},
        brandUsername(ctx),
      );

      const updated = ctx.comments.findById(commentId);
      if (!updated) {
        sendError(res, 404, "comment not found");
        return true;
      }

      sendJson(res, 200, serializeCommentWithDraft(updated, ctx));
    } catch (error) {
      handleCommentsError(res, error);
    }

    return true;
  }

  const draftMatch = /^\/api\/comments\/([^/]+)\/draft$/.exec(pathname);
  if (draftMatch && req.method === "PATCH") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    try {
      const commentId = draftMatch[1];
      const comment = ctx.comments.findById(commentId);
      if (!comment) {
        sendError(res, 404, "comment not found");
        return true;
      }

      if (comment.deletedAt) {
        sendError(res, 410, "comment was removed from instagram");
        return true;
      }

      if (comment.status !== "pending" && comment.status !== "replied") {
        sendError(res, 422, "only pending or replied comments can update draft");
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

      ctx.comments.upsertDraft(commentId, message);

      const updated = ctx.comments.findById(commentId);
      if (!updated) {
        sendError(res, 404, "comment not found");
        return true;
      }

      notifyCommentsChanged({ post_id: comment.postId });
      sendJson(res, 200, serializeCommentWithDraft(updated, ctx));
    } catch (error) {
      handleCommentsError(res, error);
    }

    return true;
  }

  if (draftMatch && req.method === "DELETE") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    try {
      const commentId = draftMatch[1];
      const comment = ctx.comments.findById(commentId);
      if (!comment) {
        sendError(res, 404, "comment not found");
        return true;
      }

      if (comment.deletedAt) {
        sendError(res, 410, "comment was removed from instagram");
        return true;
      }

      if (!ctx.comments.clearDraft(commentId)) {
        sendError(res, 404, "no draft to remove");
        return true;
      }

      const updated = ctx.comments.findById(commentId);
      if (!updated) {
        sendError(res, 404, "comment not found");
        return true;
      }

      notifyCommentsChanged({ post_id: comment.postId });
      sendJson(res, 200, serializeCommentWithDraft(updated, ctx));
    } catch (error) {
      handleCommentsError(res, error);
    }

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

      if (comment.deletedAt) {
        sendError(res, 410, "comment was removed from instagram");
        return true;
      }

      if (comment.status !== "pending" && comment.status !== "replied") {
        sendError(res, 422, "only pending or replied comments can be approved");
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
        const publishResult = await ctx.metaCommentReplier.reply(comment.igCommentId, message);
        const replyMeta = {
          replyToIgCommentId: comment.igCommentId,
          sourceIgCommentId: publishResult?.publishedIgCommentId ?? null,
        };
        if (!ctx.comments.promoteDraftToSent(commentId, message, replyMeta)) {
          ctx.comments.createReply({
            commentId,
            sentText: message,
            status: "sent",
            ...replyMeta,
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
        const updated =
          comment.status === "replied"
            ? ctx.comments.findById(commentId)
            : ctx.comments.markFailed(commentId, errorMessage);
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
        const publishResult = await ctx.metaCommentReplier.reply(comment.igCommentId, message);
        ctx.comments.createReply({
          commentId,
          sentText: message,
          status: "sent",
          replyToIgCommentId: comment.igCommentId,
          sourceIgCommentId: publishResult?.publishedIgCommentId ?? null,
        });
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
