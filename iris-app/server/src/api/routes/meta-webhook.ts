import type { IncomingMessage, ServerResponse } from "node:http";
import type { AppContext } from "../app-context.ts";
import { BodyTooLargeError, readRawBody, sendError } from "../json.ts";
import {
  parseCommentEntries,
  parseMessageEntries,
  readWebhookEnvelope,
  verifyHubSignature,
  verifySubscribeToken,
} from "../../domain/meta/meta-webhook.ts";
import { notifyCommentsChanged, notifyMessagesChanged } from "../../adapters/sse/event-bus.ts";
import { getAppSettingsOrDefault } from "../../adapters/sqlite/app-settings-repository.ts";
import { enqueueCommentReply } from "../../domain/comments/enqueue-comment-reply.ts";
import { enqueueCommentPrivateReply } from "../../domain/comments/enqueue-comment-private-reply.ts";
import {
  resolveEffectivePrivateReplyMode,
  shouldSchedulePrivateReply,
} from "../../domain/posts/private-reply-mode.ts";
import { enqueueMessageReply } from "../../domain/messages/enqueue-message-reply.ts";
import {
  resolveEffectiveReplyMode,
  shouldScheduleCommentReply,
} from "../../domain/posts/reply-mode.ts";
import {
  resolveEffectiveMessageReplyMode,
  shouldScheduleMessageReply,
} from "../../domain/messages/message-reply-mode.ts";
import { isBrandAuthor } from "../../domain/comments/is-brand-author.ts";

import { truncateWebhookPayload } from "../../domain/meta/meta-webhook-payload.ts";
import { ensureMonitoredPost } from "../../domain/comments/ensure-monitored-post.ts";
import { ingestWebhookMessage } from "../../domain/messages/ingest-webhook-message.ts";

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

    const connection = ctx.metaConnectionStore.get();
    const ownerContext = {
      igUserId: connection?.igUserId ?? null,
      igUsername: connection?.igUsername ?? null,
    };
    const messageEntries = parseMessageEntries(payload, ownerContext);
    const affectedConversations = new Set<string>();
    let messageProcessed = false;
    let linkedConversationId: string | null = null;
    let linkedMessageId: string | null = null;

    for (const entry of messageEntries) {
      const result = ingestWebhookMessage(entry, {
        conversations: ctx.conversations,
        messages: ctx.messages,
        pageIgUserId: ownerContext.igUserId,
      });

      messageProcessed = true;
      linkedConversationId = result.conversationId;
      linkedMessageId = result.messageId;
      affectedConversations.add(result.conversationId);

      if (result.created && !result.skipped) {
        const conversation = ctx.conversations.findById(result.conversationId);
        if (conversation) {
          const appSettings = getAppSettingsOrDefault(ctx.appSettingsStore);
          const effectiveReplyMode = resolveEffectiveMessageReplyMode(
            appSettings.messageReplyMode,
            conversation.replyMode,
          );

          if (shouldScheduleMessageReply(effectiveReplyMode) && ctx.resolveLlmCompleter()) {
            enqueueMessageReply(ctx, result.messageId);
          }
        }
      }
    }

    const entries = parseCommentEntries(payload);
    const affectedPosts = new Set<string>();
    const brandUsername = ctx.metaConnectionStore.get()?.igUsername ?? null;
    let processed = false;
    let linkedCommentId: string | null = null;
    let linkedPostId: string | null = null;

    for (const entry of entries) {
      let post = ctx.posts.findCommentableByIgMediaId(entry.igMediaId);
      if (!post) {
        const appSettings = getAppSettingsOrDefault(ctx.appSettingsStore);
        if (!appSettings.autoMonitorEnabled) {
          continue;
        }

        const ensured = await ensureMonitoredPost(entry.igMediaId, {
          posts: ctx.posts,
          metaCommentReader: ctx.metaCommentReader,
        });
        if (!ensured.ok) {
          continue;
        }
        post = ensured.post;
      }

      let igTimestamp = entry.igTimestamp;
      if (!igTimestamp) {
        try {
          igTimestamp = await ctx.metaCommentReader.fetchCommentTimestamp(entry.igCommentId);
        } catch {
          igTimestamp = null;
        }
      }

      const result = ctx.comments.upsertFromWebhook({
        igCommentId: entry.igCommentId,
        postId: post.id,
        parentIgCommentId: entry.parentIgCommentId,
        authorUsername: entry.authorUsername,
        text: entry.text,
        igTimestamp,
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
            enqueueCommentReply(ctx, result.comment.id);
          }

          const effectivePrivateMode = resolveEffectivePrivateReplyMode(
            appSettings.privateReplyMode,
            post.privateReplyMode,
          );
          if (shouldSchedulePrivateReply(effectivePrivateMode) && ctx.resolveLlmCompleter()) {
            enqueueCommentPrivateReply(ctx, result.comment.id);
          }
        }
      }
    }

    const commentProcessed = processed;
    const anyProcessed = commentProcessed || messageProcessed;

    ctx.webhookEvents.update(event.id, {
      processingStatus: anyProcessed
        ? "processed"
        : entries.length > 0 || messageEntries.length > 0
          ? "ignored"
          : "received",
      commentId: linkedCommentId,
      postId: linkedPostId,
      conversationId: linkedConversationId,
      messageId: linkedMessageId,
    });

    for (const postId of affectedPosts) {
      notifyCommentsChanged({ post_id: postId });
    }

    for (const conversationId of affectedConversations) {
      notifyMessagesChanged({ conversation_id: conversationId });
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
