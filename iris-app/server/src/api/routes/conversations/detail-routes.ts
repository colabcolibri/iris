import { readJsonBody, sendError, sendJson, ValidationError } from "../../json.ts";
import { createRouter, route } from "../../router.ts";
import { notifyMessagesChanged } from "../../../adapters/sse/event-bus.ts";
import {
  getMetaReadiness,
  sendMetaReadinessError,
} from "../../../domain/meta/meta-readiness.ts";
import {
  isConversationReplyModeSetting,
} from "../../../domain/messages/message-reply-mode.ts";
import type { ConversationReplyMode } from "../../../domain/messages/conversation.ts";
import { serializeConversation } from "../../../domain/messages/serialize-conversation.ts";
import { serializeConversationSummary } from "./conversation-api.ts";
import { serializeMessageWithDraft } from "../messages/shared.ts";
import { syncConversationMessages, syncConversationsFromMeta } from "../../../domain/messages/sync-conversation-messages.ts";
import { hydrateConversationParticipantIfNeeded } from "../../../domain/messages/hydrate-conversation-participant.ts";
import { reconcileConversationPendingStatuses } from "../../../domain/messages/reconcile-conversation-pending-statuses.ts";
import { markConversationReadUpTo } from "../../../domain/messages/mark-conversation-read.ts";
import { purgeMessageHistory } from "../../../domain/messages/purge-message-history.ts";
import { sendConversationReply } from "../../../domain/messages/send-conversation-reply.ts";
import { MAX_MESSAGE_REPLY_LENGTH } from "../messages/shared.ts";
import { routeParam } from "../../route-resources.ts";
import type { RouteMatch } from "../../route-types.ts";

function requireConversation(match: RouteMatch, id: string) {
  const conversation = match.ctx.conversations.findById(id);
  if (!conversation) {
    sendError(match.res, 404, "conversation not found");
    return null;
  }
  return conversation;
}

export const conversationsDetailRouter = createRouter([
  route("GET", "/api/conversations", { admin: true }, async (match) => {
    const limitRaw = Number(match.searchParams.get("limit") ?? "50");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
    const conversations = match.ctx.conversations.listRecent(limit).map((conversation) =>
      serializeConversationSummary(conversation, match.ctx),
    );
    sendJson(match.res, 200, { conversations });
  }),

  route("POST", "/api/conversations/sync", { admin: true, metaReady: true }, async (match) => {
    const readiness = getMetaReadiness(match.ctx);
    if (!readiness.ready) {
      sendMetaReadinessError(match.res, readiness);
      return;
    }

    const limitRaw = Number(match.searchParams.get("limit") ?? "25");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 25) : 25;

    const result = await syncConversationsFromMeta(limit, {
      conversations: match.ctx.conversations,
      messages: match.ctx.messages,
      metaConversationsReader: match.ctx.metaConversationsReader,
      resolveOwnerIgUserId: () => match.ctx.metaConnectionStore.get()?.igUserId ?? null,
      resolveOwnerUsername: () => match.ctx.metaConnectionStore.get()?.igUsername ?? null,
    });

    const purged = purgeMessageHistory({ messages: match.ctx.messages });

    notifyMessagesChanged({});
    sendJson(match.res, 200, { ...result, purged });
  }, { errorOptions: { upstream502: true } }),

  route("POST", "/api/conversations/purge-history", { admin: true }, async (match) => {
    const purged = purgeMessageHistory({ messages: match.ctx.messages });
    notifyMessagesChanged({});
    sendJson(match.res, 200, purged);
  }),

  route(
    "POST",
    /^\/api\/conversations\/([^/]+)\/reply$/,
    { admin: true, metaReady: true },
    async (match) => {
      const conversationId = routeParam(match, "conversationId");
      const conversation = requireConversation(match, conversationId);
      if (!conversation) {
        return;
      }

      const readiness = getMetaReadiness(match.ctx);
      if (!readiness.ready) {
        sendMetaReadinessError(match.res, readiness);
        return;
      }

      const body = await readJsonBody<{
        message?: unknown;
        reply_to_message_id?: unknown;
      }>(match.req);
      const text = typeof body.message === "string" ? body.message.trim() : "";
      if (!text) {
        throw new ValidationError("message is required");
      }
      if (text.length > MAX_MESSAGE_REPLY_LENGTH) {
        throw new ValidationError(
          `message must be at most ${MAX_MESSAGE_REPLY_LENGTH} characters`,
        );
      }

      const replyToMessageId =
        typeof body.reply_to_message_id === "string" && body.reply_to_message_id.trim()
          ? body.reply_to_message_id.trim()
          : null;

      try {
        const outbound = await sendConversationReply(
          {
            conversationId: conversation.id,
            text,
            replyToMessageId,
          },
          {
            conversations: match.ctx.conversations,
            messages: match.ctx.messages,
            metaMessageSender: match.ctx.metaMessageSender,
            metaConversationsReader: match.ctx.metaConversationsReader,
            ownerIgUserId: match.ctx.metaConnectionStore.get()?.igUserId ?? null,
            ownerUsername: match.ctx.metaConnectionStore.get()?.igUsername ?? null,
          },
        );

        notifyMessagesChanged({ conversation_id: conversation.id });
        sendJson(match.res, 200, serializeMessageWithDraft(outbound, match.ctx));
      } catch (error) {
        console.error(
          `[messages] conversation reply failed for ${conversation.id}:`,
          error instanceof Error ? error.message : error,
        );
        throw error;
      }
    },
    { paramNames: ["conversationId"], errorOptions: { upstream502: true } },
  ),

  route(
    "GET",
    /^\/api\/conversations\/([^/]+)\/messages$/,
    { admin: true },
    async (match) => {
      const conversationId = routeParam(match, "conversationId");
      const conversation = requireConversation(match, conversationId);
      if (!conversation) {
        return;
      }

      reconcileConversationPendingStatuses(conversationId, match.ctx.messages);

      let hydrated = conversation;
      const readiness = getMetaReadiness(match.ctx);
      if (readiness.ready) {
        hydrated = await hydrateConversationParticipantIfNeeded(conversation, {
          conversations: match.ctx.conversations,
          metaConversationsReader: match.ctx.metaConversationsReader,
          ownerIgUserId: match.ctx.metaConnectionStore.get()?.igUserId ?? null,
          ownerUsername: match.ctx.metaConnectionStore.get()?.igUsername ?? null,
        });
      }

      const thread = match.ctx.messages.listByConversationId(conversationId);
      const messages = thread.map((message) =>
        serializeMessageWithDraft(message, match.ctx),
      );

      const readAt = markConversationReadUpTo(hydrated, thread);
      if (readAt) {
        hydrated =
          match.ctx.conversations.updateOperatorReadAt(conversationId, readAt) ?? hydrated;
      }

      sendJson(match.res, 200, {
        conversation: serializeConversationSummary(hydrated, match.ctx, thread),
        messages,
      });
    },
    { paramNames: ["conversationId"] },
  ),

  route(
    "POST",
    /^\/api\/conversations\/([^/]+)\/sync$/,
    { admin: true, metaReady: true },
    async (match) => {
      const conversationId = routeParam(match, "conversationId");
      const conversation = requireConversation(match, conversationId);
      if (!conversation) {
        return;
      }

      const readiness = getMetaReadiness(match.ctx);
      if (!readiness.ready) {
        sendMetaReadinessError(match.res, readiness);
        return;
      }

      const result = await syncConversationMessages(conversationId, {
        conversations: match.ctx.conversations,
        messages: match.ctx.messages,
        metaConversationsReader: match.ctx.metaConversationsReader,
        resolveOwnerIgUserId: () => match.ctx.metaConnectionStore.get()?.igUserId ?? null,
        resolveOwnerUsername: () => match.ctx.metaConnectionStore.get()?.igUsername ?? null,
      });

      notifyMessagesChanged({ conversation_id: conversationId });
      sendJson(match.res, 200, result);
    },
    { paramNames: ["conversationId"], errorOptions: { upstream502: true } },
  ),

  route(
    "PATCH",
    /^\/api\/conversations\/([^/]+)$/,
    { admin: true },
    async (match) => {
      const conversationId = routeParam(match, "conversationId");
      const conversation = requireConversation(match, conversationId);
      if (!conversation) {
        return;
      }

      const body = await readJsonBody<Record<string, unknown>>(match.req);
      const hasReplyMode = "reply_mode" in body;
      const hasReplyPrompt = "reply_prompt" in body;

      if (!hasReplyMode && !hasReplyPrompt) {
        throw new ValidationError("at least one of reply_mode or reply_prompt is required");
      }

      let updated = conversation;

      if (hasReplyMode) {
        if (
          typeof body.reply_mode !== "string" ||
          !isConversationReplyModeSetting(body.reply_mode)
        ) {
          throw new ValidationError("reply_mode must be inherit, off, auto, or draft");
        }
        const next = match.ctx.conversations.updateReplyMode(
          conversationId,
          body.reply_mode as ConversationReplyMode,
        );
        if (next) {
          updated = next;
        }
      }

      if (hasReplyPrompt) {
        const replyPrompt =
          body.reply_prompt === null
            ? null
            : typeof body.reply_prompt === "string"
              ? body.reply_prompt
              : undefined;
        if (replyPrompt === undefined) {
          throw new ValidationError("reply_prompt must be a string or null");
        }
        const next = match.ctx.conversations.updateReplyPrompt(conversationId, replyPrompt);
        if (next) {
          updated = next;
        }
      }

      sendJson(match.res, 200, serializeConversation(updated));
    },
    { paramNames: ["conversationId"] },
  ),
]);
