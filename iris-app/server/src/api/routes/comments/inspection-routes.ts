import { sendError, sendJson } from "../../json.ts";
import { createRouter, route } from "../../router.ts";
import { buildReplyInspection } from "../../../domain/reply-context/build-reply-inspection.ts";
import { assembleReplyContext } from "../../../domain/reply-context/reply-context-assembler.ts";
import { serializeReplyContext } from "../../../domain/reply-context/serialize-reply-context.ts";
import { resolveCommentReplyAudit } from "../../../domain/reply-audit/resolve-reply-audit.ts";
import { serializeReplyAudit } from "../../../domain/reply-audit/serialize-reply-audit.ts";
import { requireComment, routeParam } from "../../route-resources.ts";

export const commentsInspectionRouter = createRouter([
  route(
    "GET",
    /^\/api\/posts\/([^/]+)\/reply-inspection$/,
    { admin: true },
    async (match) => {
      const postId = routeParam(match, "postId");
      const inspection = buildReplyInspection(postId, match.ctx.replyContextAssembler);

      if (!inspection) {
        sendError(match.res, 404, "post not found");
        return;
      }

      sendJson(match.res, 200, inspection);
    },
    { paramNames: ["postId"] },
  ),

  route(
    "GET",
    /^\/api\/comments\/([^/]+)\/reply-context$/,
    { adminOrAgent: true },
    async (match) => {
      const commentId = routeParam(match, "commentId");
      const comment = requireComment(match, commentId);
      if (!comment) {
        return;
      }

      const context = await assembleReplyContext(commentId, match.ctx.replyContextAssembler);
      if (!context) {
        sendError(match.res, 404, "comment not found");
        return;
      }

      const post = match.ctx.posts.findById(comment.postId);
      sendJson(
        match.res,
        200,
        serializeReplyContext(context, {
          commentId: comment.id,
          igCommentId: comment.igCommentId,
          postId: comment.postId,
          igMediaId: post?.igMediaId ?? null,
        }),
      );
    },
    { paramNames: ["commentId"] },
  ),

  route(
    "GET",
    /^\/api\/comments\/([^/]+)\/reply-audit$/,
    { admin: true },
    async (match) => {
      const commentId = routeParam(match, "commentId");
      const comment = requireComment(match, commentId);
      if (!comment) {
        return;
      }

      const resolved = resolveCommentReplyAudit(commentId, {
        agentRuns: match.ctx.agentRuns,
        agentRunSteps: match.ctx.agentRunSteps,
        comments: match.ctx.comments,
      });
      if (!resolved) {
        sendError(match.res, 404, "no agent run for comment");
        return;
      }

      sendJson(match.res, 200, serializeReplyAudit(resolved.run, resolved.steps));
    },
    { paramNames: ["commentId"] },
  ),
]);
