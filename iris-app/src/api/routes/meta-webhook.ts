import type { IncomingMessage, ServerResponse } from "node:http";
import type { AppContext } from "../app-context.ts";
import { BodyTooLargeError, readRawBody, sendError } from "../json.ts";
import {
  parseCommentEntries,
  readWebhookEnvelope,
  verifyHubSignature,
  verifySubscribeToken,
} from "../../domain/meta-webhook.ts";
import { notifyCommentsChanged } from "../../adapters/sse/event-bus.ts";
import {
  scheduleCommentReply,
  shouldScheduleCommentReply,
} from "../../domain/comments/process-comment-reply.ts";
import { isBrandAuthor } from "../../domain/comments/is-brand-author.ts";

const PAYLOAD_PREVIEW_BYTES = 2048;

export function handleMetaWebhookRoute(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
  pathname: string,
): Promise<boolean> {
  if (pathname !== "/webhooks/meta") {
    return Promise.resolve(false);
  }

  if (req.method === "GET") {
    const url = new URL(req.url ?? "/", "http://localhost");
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (
      mode !== "subscribe" ||
      !challenge ||
      !verifySubscribeToken(token, ctx.metaWebhookVerifyToken ?? "")
    ) {
      sendError(res, 403, "invalid verify token");
      return Promise.resolve(true);
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(challenge);
    return Promise.resolve(true);
  }

  if (req.method !== "POST") {
    sendError(res, 405, "method not allowed");
    return Promise.resolve(true);
  }

  return handleMetaWebhookPost(req, res, ctx);
}

async function handleMetaWebhookPost(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
): Promise<boolean> {
  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers["x-hub-signature-256"];
    const signatureHeader = Array.isArray(signature) ? signature[0] : signature;

    if (
      !verifyHubSignature(
        rawBody,
        signatureHeader,
        ctx.metaAppSecret ?? "",
      )
    ) {
      sendError(res, 403, "invalid signature");
      return true;
    }

    const payload = JSON.parse(rawBody.toString("utf8")) as unknown;
    const envelope = readWebhookEnvelope(payload);
    const event = ctx.webhookEvents.insert({
      object: envelope.object,
      field: envelope.field,
      payloadJson: rawBody.toString("utf8"),
    });

    const entries = parseCommentEntries(payload);
    const affectedPosts = new Set<string>();
    const brandUsername = ctx.metaConnectionStore.get()?.igUsername ?? null;
    let processed = false;
    let linkedCommentId: string | null = null;
    let linkedPostId: string | null = null;

    for (const entry of entries) {
      const post = ctx.posts.findCommentableByIgMediaId(entry.igMediaId);
      if (!post) {
        continue;
      }

      const result = ctx.comments.upsertFromWebhook({
        igCommentId: entry.igCommentId,
        postId: post.id,
        parentIgCommentId: entry.parentIgCommentId,
        authorUsername: entry.authorUsername,
        text: entry.text,
      });

      processed = true;
      linkedCommentId = result.comment.id;
      linkedPostId = post.id;

      if (result.created) {
        affectedPosts.add(post.id);

        if (isBrandAuthor(entry.authorUsername, brandUsername)) {
          if (result.comment.status === "pending") {
            ctx.comments.markSkipped(result.comment.id);
          }
        } else if (
          shouldScheduleCommentReply(post.replyMode) &&
          ctx.resolveLlmCompleter()
        ) {
          scheduleCommentReply(ctx, result.comment.id);
        }
      }
    }

    ctx.webhookEvents.update(event.id, {
      processingStatus: processed ? "processed" : entries.length > 0 ? "ignored" : "received",
      commentId: linkedCommentId,
      postId: linkedPostId,
    });

    for (const postId of affectedPosts) {
      notifyCommentsChanged({ post_id: postId });
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return true;
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      sendError(res, 413, error.message);
      return true;
    }

    sendError(res, 500, "internal server error");
    return true;
  }
}

export function truncateWebhookPayload(payloadJson: string): string {
  if (payloadJson.length <= PAYLOAD_PREVIEW_BYTES) {
    return payloadJson;
  }

  return `${payloadJson.slice(0, PAYLOAD_PREVIEW_BYTES)}…`;
}
