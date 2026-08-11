import { sendError, sendJson } from "../../json.ts";
import { createRouter, route } from "../../router.ts";
import { notifyCommentsChanged } from "../../../adapters/sse/event-bus.ts";
import { syncPostComments } from "../../../domain/comments/sync-post-comments.ts";
import {
  planCommentThreadReconciliation,
  reconcileCommentThreadStatuses,
} from "../../../domain/comments/reconcile-comment-thread-statuses.ts";
import { requirePost, routeParam } from "../../route-resources.ts";
import {
  brandUsername,
  commentReconcileDeps,
  serializeCommentWithDraft,
} from "./shared.ts";

export const commentsPostCommentsRouter = createRouter([
  route(
    "GET",
    /^\/api\/posts\/([^/]+)\/comments\/reconcile-preview$/,
    { admin: true },
    async (match) => {
      const postId = routeParam(match, "postId");
      if (!requirePost(match, postId)) {
        return;
      }

      const brand = brandUsername(match.ctx);
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
      });
    },
    { paramNames: ["postId"] },
  ),

  route(
    "POST",
    /^\/api\/posts\/([^/]+)\/comments\/reconcile$/,
    { admin: true },
    async (match) => {
      const postId = routeParam(match, "postId");
      if (!requirePost(match, postId)) {
        return;
      }

      const brand = brandUsername(match.ctx);
      const result = reconcileCommentThreadStatuses(
        postId,
        brand,
        commentReconcileDeps(match.ctx),
      );

      notifyCommentsChanged({ post_id: postId });

      sendJson(match.res, 200, {
        post_id: postId,
        brand_username: brand,
        linked_count: result.linkedCount,
        skipped_brand_count: result.skippedBrandCount,
        linkable_count: result.plan.links.length,
        comments: match.ctx.comments.listByPostId(postId).map((comment) =>
          serializeCommentWithDraft(comment, match.ctx),
        ),
      });
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
        const result = await syncPostComments(
          { postId, igMediaId: post.igMediaId },
          {
            metaCommentReader: match.ctx.metaCommentReader,
            upsertFromWebhook: (input) => match.ctx.comments.upsertFromWebhook(input),
            listByPostId: (id) => match.ctx.comments.listByPostId(id),
            markDeletedFromInstagram: (id) =>
              match.ctx.comments.markDeletedFromInstagram(id),
            restoreFromInstagram: (id) => match.ctx.comments.restoreFromInstagram(id),
          },
        );

        reconcileCommentThreadStatuses(
          postId,
          brandUsername(match.ctx),
          commentReconcileDeps(match.ctx),
        );

        const comments = match.ctx.comments.listByPostId(postId);
        notifyCommentsChanged({ post_id: postId });

        sendJson(match.res, 200, {
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
