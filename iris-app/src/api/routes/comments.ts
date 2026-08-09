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

  const listMatch = /^\/api\/posts\/([^/]+)\/comments$/.exec(pathname);
  if (listMatch && req.method === "GET") {
    const postId = listMatch[1];
    const post = ctx.posts.findById(postId);
    if (!post) {
      sendError(res, 404, "post not found");
      return true;
    }

    const comments = ctx.comments.listByPostId(postId);
    sendJson(res, 200, { comments: comments.map(serializeComment) });
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

      if (!ctx.metaCommentReplier) {
        sendError(res, 503, "Meta comment replier not configured");
        return true;
      }

      try {
        await ctx.metaCommentReplier.reply(comment.igCommentId, message);
        ctx.comments.createReply(commentId, message, "sent");
        const updated = ctx.comments.markReplied(commentId);
        notifyCommentsChanged({ post_id: comment.postId });
        sendJson(res, 200, serializeComment(updated!));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "reply failed";
        ctx.comments.createReply(commentId, message, "failed");
        const updated = ctx.comments.markFailed(commentId, errorMessage);
        notifyCommentsChanged({ post_id: comment.postId });
        sendJson(res, 200, serializeComment(updated!));
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

  sendError(res, 500, "internal server error");
}
