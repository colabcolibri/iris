import { sendError, sendJson } from "../../json.ts";
import { createRouter, route } from "../../router.ts";
import { notifyCommentsChanged } from "../../../adapters/sse/event-bus.ts";
import { refreshAndReconcilePostComments } from "../../../domain/comments/refresh-and-reconcile-post-comments.ts";
import {
  planCommentThreadReconciliation,
} from "../../../domain/comments/reconcile-comment-thread-statuses.ts";
import { syncPostComments } from "../../../domain/comments/sync-post-comments.ts";
import { requirePost, routeParam } from "../../route-resources.ts";
import {
  brandUsername,
  commentReconcileDeps,
  postCommentSyncDeps,
  serializeCommentWithDraft,
} from "./shared.ts";

function reconcileSyncPayload(
  sync: Awaited<ReturnType<typeof syncPostComments>>,
) {
  return {
    synced_at: sync.syncedAt,
    comments_fetched: sync.commentsFetched,
    access_limited: sync.accessLimited,
    warning: sync.warning,
    marked_deleted: sync.markedDeleted,
    restored: sync.restored,
  };
}

export const commentsPostCommentsRouter = createRouter([
  route(
    "GET",
    /^\/api\/posts\/([^/]+)\/comments\/reconcile-preview$/,
    { admin: true, metaReady: true },
    async (match) => {
      const postId = routeParam(match, "postId");
      const post = requirePost(match, postId);
      if (!post) {
        return;
      }

      if (!post.igMediaId) {
        sendError(match.res, 422, "post has no ig_media_id");
        return;
      }

      const brand = brandUsername(match.ctx);

      try {
        const sync = await syncPostComments(
          { postId, igMediaId: post.igMediaId },
          postCommentSyncDeps(match.ctx),
        );

        const plan = planCommentThreadReconciliation(
          postId,
          brand,
          match.ctx.comments.listByPostId,
          match.ctx.comments.hasReplyRecord,
        );

        sendJson(match.res, 200, {
          post_id: postId,
          brand_username: brand,
          linkable_count: plan.links.length,
          skipped_brand_count: plan.skippedBrandCommentIds.length,
          links: plan.links.map((link) => ({
            user_comment_id: link.userCommentId,
            brand_ig_comment_id: link.brandIgCommentId,
            preview_text: link.sentText,
          })),
          ...reconcileSyncPayload(sync),
          comments: match.ctx.comments.listByPostId(postId).map((comment) =>
            serializeCommentWithDraft(comment, match.ctx),
          ),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "failed to sync comments";
        sendError(match.res, 502, message);
      }
    },
    { paramNames: ["postId"] },
  ),

  route(
    "POST",
    /^\/api\/posts\/([^/]+)\/comments\/reconcile$/,
    { admin: true, metaReady: true },
    async (match) => {
      const postId = routeParam(match, "postId");
      const post = requirePost(match, postId);
      if (!post) {
        return;
      }

      if (!post.igMediaId) {
        sendError(match.res, 422, "post has no ig_media_id");
        return;
      }

      const brand = brandUsername(match.ctx);

      try {
        const result = await refreshAndReconcilePostComments({
          postId,
          igMediaId: post.igMediaId,
          brandUsername: brand,
          syncDeps: postCommentSyncDeps(match.ctx),
          reconcileDeps: commentReconcileDeps(match.ctx),
        });

        notifyCommentsChanged({ post_id: postId });

        sendJson(match.res, 200, {
          post_id: postId,
          brand_username: brand,
          linked_count: result.reconcile.linkedCount,
          skipped_brand_count: result.reconcile.skippedBrandCount,
          linkable_count: result.reconcile.plan.links.length,
          ...reconcileSyncPayload(result.sync),
          comments: result.comments.map((comment) =>
            serializeCommentWithDraft(comment, match.ctx),
          ),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "failed to reconcile comments";
        sendError(match.res, 502, message);
      }
    },
    { paramNames: ["postId"] },
  ),

  route(
    "POST",
    /^\/api\/posts\/([^/]+)\/comments\/sync$/,
    { admin: true, metaReady: true },
    async (match) => {
      const postId = routeParam(match, "postId");
      const post = requirePost(match, postId);
      if (!post) {
        return;
      }

      if (!post.igMediaId) {
        sendError(match.res, 422, "post has no ig_media_id");
        return;
      }

      try {
        const result = await refreshAndReconcilePostComments({
          postId,
          igMediaId: post.igMediaId,
          brandUsername: brandUsername(match.ctx),
          syncDeps: postCommentSyncDeps(match.ctx),
          reconcileDeps: commentReconcileDeps(match.ctx),
        });

        notifyCommentsChanged({ post_id: postId });

        sendJson(match.res, 200, {
          post_id: result.sync.postId,
          ig_media_id: result.sync.igMediaId,
          synced_at: result.sync.syncedAt,
          reported_comments_count: result.sync.reportedCommentsCount,
          comments_fetched: result.sync.commentsFetched,
          access_limited: result.sync.accessLimited,
          warning: result.sync.warning,
          marked_deleted: result.sync.markedDeleted,
          restored: result.sync.restored,
          linked_count: result.reconcile.linkedCount,
          comments: result.comments.map((comment) =>
            serializeCommentWithDraft(comment, match.ctx),
          ),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "failed to sync comments";
        sendError(match.res, 502, message);
      }
    },
    { paramNames: ["postId"] },
  ),

  route(
    "GET",
    /^\/api\/posts\/([^/]+)\/comments$/,
    async (match) => {
      const postId = routeParam(match, "postId");
      if (!requirePost(match, postId)) {
        return;
      }

      const comments = match.ctx.comments.listByPostId(postId);
      sendJson(match.res, 200, {
        comments: comments.map((comment) => serializeCommentWithDraft(comment, match.ctx)),
      });
    },
    { paramNames: ["postId"] },
  ),
]);
