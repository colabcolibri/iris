import { readJsonBody, sendError, sendJson, ValidationError } from "../../json.ts";
import { createRouter, route } from "../../router.ts";
import { notifyCommentsChanged } from "../../../adapters/sse/event-bus.ts";
import {
  getMetaReadiness,
  metaReadinessMessage,
} from "../../../domain/meta/meta-readiness.ts";
import { requestManualCommentReply } from "../../../domain/comments/request-manual-comment-reply.ts";
import { requireComment, routeParam } from "../../route-resources.ts";
import {
  brandUsername,
  MAX_REPLY_LENGTH,
  serializeCommentWithDraft,
} from "./shared.ts";

export const commentsReplyRouter = createRouter([
  route(
    "POST",
    /^\/api\/comments\/([^/]+)\/ai-reply$/,
    { admin: true },
    async (match) => {
      const commentId = routeParam(match, "commentId");
      const comment = requireComment(match, commentId, { rejectDeleted: true });
      if (!comment) {
        return;
      }

      const body = await readJsonBody<{ mode?: unknown }>(match.req);
      const mode = body.mode;
      if (mode !== "auto" && mode !== "draft") {
        throw new ValidationError('mode must be "auto" or "draft"');
      }

      await requestManualCommentReply(
        match.ctx,
        commentId,
        mode,
        {},
        brandUsername(match.ctx),
      );

      const updated = match.ctx.comments.findById(commentId);
      if (!updated) {
        sendError(match.res, 404, "comment not found");
        return;
      }

      sendJson(match.res, 200, serializeCommentWithDraft(updated, match.ctx));
    },
    { paramNames: ["commentId"], errorOptions: { upstream502: true } },
  ),

  route(
    "PATCH",
    /^\/api\/comments\/([^/]+)\/draft$/,
    { admin: true },
    async (match) => {
      const commentId = routeParam(match, "commentId");
      const comment = requireComment(match, commentId, { rejectDeleted: true });
      if (!comment) {
        return;
      }

      if (comment.status !== "pending" && comment.status !== "replied") {
        sendError(match.res, 422, "only pending or replied comments can update draft");
        return;
      }

      const body = await readJsonBody<{ message?: unknown }>(match.req);
      const message = typeof body.message === "string" ? body.message.trim() : "";

      if (!message) {
        throw new ValidationError("message is required");
      }

      if (message.length > MAX_REPLY_LENGTH) {
        throw new ValidationError(`message must be at most ${MAX_REPLY_LENGTH} characters`);
      }

      match.ctx.comments.upsertDraft(commentId, message);

      const updated = match.ctx.comments.findById(commentId);
      if (!updated) {
        sendError(match.res, 404, "comment not found");
        return;
      }

      notifyCommentsChanged({ post_id: comment.postId });
      sendJson(match.res, 200, serializeCommentWithDraft(updated, match.ctx));
    },
    { paramNames: ["commentId"] },
  ),

  route(
    "DELETE",
    /^\/api\/comments\/([^/]+)\/draft$/,
    { admin: true },
    async (match) => {
      const commentId = routeParam(match, "commentId");
      const comment = requireComment(match, commentId, { rejectDeleted: true });
      if (!comment) {
        return;
      }

      if (!match.ctx.comments.clearDraft(commentId)) {
        sendError(match.res, 404, "no draft to remove");
        return;
      }

      const updated = match.ctx.comments.findById(commentId);
      if (!updated) {
        sendError(match.res, 404, "comment not found");
        return;
      }

      notifyCommentsChanged({ post_id: comment.postId });
      sendJson(match.res, 200, serializeCommentWithDraft(updated, match.ctx));
    },
    { paramNames: ["commentId"] },
  ),

  route(
    "POST",
    /^\/api\/comments\/([^/]+)\/approve-reply$/,
    { admin: true },
    async (match) => {
      const commentId = routeParam(match, "commentId");
      const comment = requireComment(match, commentId, { rejectDeleted: true });
      if (!comment) {
        return;
      }

      if (comment.status !== "pending" && comment.status !== "replied") {
        sendError(match.res, 422, "only pending or replied comments can be approved");
        return;
      }

      const body = await readJsonBody<{ message?: unknown }>(match.req);
      const draft = match.ctx.comments.findLatestDraft(commentId);
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

      const readiness = getMetaReadiness(match.ctx);
      if (!readiness.ready) {
        sendError(match.res, 503, metaReadinessMessage(readiness));
        return;
      }

      try {
        const publishResult = await match.ctx.metaCommentReplier.reply(
          comment.igCommentId,
          message,
        );
        const replyMeta = {
          replyToIgCommentId: comment.igCommentId,
          sourceIgCommentId: publishResult?.publishedIgCommentId ?? null,
        };
        if (!match.ctx.comments.promoteDraftToSent(commentId, message, replyMeta)) {
          match.ctx.comments.createReply({
            commentId,
            sentText: message,
            status: "sent",
            ...replyMeta,
          });
        }
        const updated = match.ctx.comments.markReplied(commentId);
        notifyCommentsChanged({ post_id: comment.postId });
        sendJson(match.res, 200, serializeCommentWithDraft(updated!, match.ctx));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "reply failed";
        match.ctx.comments.createReply({
          commentId,
          sentText: message,
          status: "failed",
        });
        const updated =
          comment.status === "replied"
            ? match.ctx.comments.findById(commentId)
            : match.ctx.comments.markFailed(commentId, errorMessage);
        notifyCommentsChanged({ post_id: comment.postId });
        sendJson(match.res, 200, serializeCommentWithDraft(updated!, match.ctx));
      }
    },
    { paramNames: ["commentId"] },
  ),

  route(
    "POST",
    /^\/api\/comments\/([^/]+)\/reply$/,
    { admin: true },
    async (match) => {
      const commentId = routeParam(match, "commentId");
      const comment = requireComment(match, commentId);
      if (!comment) {
        return;
      }

      if (comment.status !== "pending") {
        sendError(match.res, 422, "only pending comments can be replied");
        return;
      }

      const body = await readJsonBody<{ message?: unknown }>(match.req);
      const message = typeof body.message === "string" ? body.message.trim() : "";

      if (!message) {
        throw new ValidationError("message is required");
      }

      if (message.length > MAX_REPLY_LENGTH) {
        throw new ValidationError(`message must be at most ${MAX_REPLY_LENGTH} characters`);
      }

      const readiness = getMetaReadiness(match.ctx);
      if (!readiness.ready) {
        sendError(match.res, 503, metaReadinessMessage(readiness));
        return;
      }

      try {
        const publishResult = await match.ctx.metaCommentReplier.reply(
          comment.igCommentId,
          message,
        );
        match.ctx.comments.createReply({
          commentId,
          sentText: message,
          status: "sent",
          replyToIgCommentId: comment.igCommentId,
          sourceIgCommentId: publishResult?.publishedIgCommentId ?? null,
        });
        const updated = match.ctx.comments.markReplied(commentId);
        notifyCommentsChanged({ post_id: comment.postId });
        sendJson(match.res, 200, serializeCommentWithDraft(updated!, match.ctx));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "reply failed";
        match.ctx.comments.createReply({ commentId, sentText: message, status: "failed" });
        const updated = match.ctx.comments.markFailed(commentId, errorMessage);
        notifyCommentsChanged({ post_id: comment.postId });
        sendJson(match.res, 200, serializeCommentWithDraft(updated!, match.ctx));
      }
    },
    { paramNames: ["commentId"] },
  ),
]);
