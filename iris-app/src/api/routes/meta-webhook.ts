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
import { getAppSettingsOrDefault } from "../../adapters/sqlite/app-settings-repository.ts";
import { scheduleCommentReply } from "../../domain/comments/process-comment-reply.ts";
import {
  resolveEffectiveReplyMode,
  shouldScheduleCommentReply,
} from "../../domain/reply-mode.ts";
import { isBrandAuthor } from "../../domain/comments/is-brand-author.ts";

import { truncateWebhookPayload } from "../../domain/meta-webhook-payload.ts";
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

function persistWebhookReceipt(
  ctx: AppContext,
  input: {
    payloadJson: string;
    signatureValid: boolean;
    processingStatus?: "received" | "failed";
    errorMessage?: string | null;
    object?: string | null;
    field?: string | null;
  },
) {
  return ctx.webhookEvents.insert({
    payloadJson: input.payloadJson,
    signatureValid: input.signatureValid,
    processingStatus: input.processingStatus,
    errorMessage: input.errorMessage,
    object: input.object ?? null,
    field: input.field ?? null,
  });
}

async function handleMetaWebhookPost(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
): Promise<boolean> {
  let eventId: string | null = null;

  try {
    const rawBody = await readRawBody(req);
    const payloadJson = rawBody.toString("utf8");
    const signature = req.headers["x-hub-signature-256"];
    const signatureHeader = Array.isArray(signature) ? signature[0] : signature;
    const signatureValid = verifyHubSignature(
      rawBody,
      signatureHeader,
      ctx.metaAppSecret ?? "",
    );

    const event = persistWebhookReceipt(ctx, {
      payloadJson: truncateWebhookPayload(payloadJson),
      signatureValid,
      processingStatus: signatureValid ? "received" : "failed",
      errorMessage: signatureValid ? null : "invalid signature",
    });
    eventId = event.id;

    if (!signatureValid) {
      sendError(res, 403, "invalid signature");
      return true;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(payloadJson) as unknown;
    } catch {
      ctx.webhookEvents.update(event.id, {
        processingStatus: "failed",
        errorMessage: "invalid json payload",
      });
      sendError(res, 400, "invalid json payload");
      return true;
    }

    const envelope = readWebhookEnvelope(payload);
    ctx.webhookEvents.update(event.id, {
      object: envelope.object,
      field: envelope.field,
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
        } else {
          const appSettings = getAppSettingsOrDefault(ctx.appSettingsStore);
          const effectiveReplyMode = resolveEffectiveReplyMode(
            appSettings.replyMode,
            post.replyMode,
          );

          if (shouldScheduleCommentReply(effectiveReplyMode) && ctx.resolveLlmCompleter()) {
            scheduleCommentReply(ctx, result.comment.id);
          }
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
      persistWebhookReceipt(ctx, {
        payloadJson: "",
        signatureValid: false,
        processingStatus: "failed",
        errorMessage: error.message,
      });
      sendError(res, 413, error.message);
      return true;
    }

    if (eventId) {
      ctx.webhookEvents.update(eventId, {
        processingStatus: "failed",
        errorMessage: error instanceof Error ? error.message : "internal server error",
      });
    } else {
      persistWebhookReceipt(ctx, {
        payloadJson: "",
        signatureValid: false,
        processingStatus: "failed",
        errorMessage: error instanceof Error ? error.message : "internal server error",
      });
    }

    sendError(res, 500, "internal server error");
    return true;
  }
}
