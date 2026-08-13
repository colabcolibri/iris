import { readJsonBody, sendError, sendJson, ValidationError } from "../../json.ts";
import { createRouter, route } from "../../router.ts";
import { notifyMessagesChanged } from "../../../adapters/sse/event-bus.ts";
import {
  getMetaReadiness,
  sendMetaReadinessError,
} from "../../../domain/meta/meta-readiness.ts";
import { requestManualMessageReply } from "../../../domain/messages/request-manual-message-reply.ts";
import { assertCanReplyToConversation } from "../../../domain/messages/assert-can-reply-to-conversation.ts";
import { routeParam } from "../../route-resources.ts";
import { requireMessage } from "./message-resources.ts";
import { MAX_MESSAGE_REPLY_LENGTH, serializeMessageWithDraft } from "./shared.ts";
import { resolveMessageDraftText } from "../../../domain/messages/resolve-message-draft.ts";

export const messagesReplyRouter = createRouter([
  route(
    "POST",
    /^\/api\/messages\/([^/]+)\/ai-reply$/,
    { admin: true },
    async (match) => {
      const messageId = routeParam(match, "messageId");
      const message = requireMessage(match, messageId);
      if (!message) {
        return;
      }

      const body = await readJsonBody<{ mode?: unknown }>(match.req);
      const mode = body.mode;
      if (mode !== "auto" && mode !== "draft") {
        throw new ValidationError('mode must be "auto" or "draft"');
      }

      if (mode === "auto") {
        assertCanReplyToConversation(match.ctx.messages, message.conversationId);
      }

      await requestManualMessageReply(match.ctx, messageId, mode, {});

      const updated = match.ctx.messages.findById(messageId);
      if (!updated) {
        sendError(match.res, 404, "message not found");
        return;
      }

      sendJson(match.res, 200, serializeMessageWithDraft(updated, match.ctx));
    },
    { paramNames: ["messageId"], errorOptions: { upstream502: true } },
  ),

  route(
    "PATCH",
    /^\/api\/messages\/([^/]+)\/draft$/,
    { admin: true },
    async (match) => {
      const messageId = routeParam(match, "messageId");
      const message = requireMessage(match, messageId);
      if (!message) {
        return;
      }

      if (
        message.status !== "pending" &&
        message.status !== "replied" &&
        message.status !== "failed"
      ) {
        sendError(match.res, 422, "only pending, failed or replied messages can update draft");
        return;
      }

      const body = await readJsonBody<{ message?: unknown }>(match.req);
      const text = typeof body.message === "string" ? body.message.trim() : "";
      if (!text) {
        throw new ValidationError("message is required");
      }
      if (text.length > MAX_MESSAGE_REPLY_LENGTH) {
        throw new ValidationError(
          `message must be at most ${MAX_MESSAGE_REPLY_LENGTH} characters`,
        );
      }

      match.ctx.messageReplies.upsertDraft({ messageId, draftText: text });
      const updated = match.ctx.messages.findById(messageId);
      if (!updated) {
        sendError(match.res, 404, "message not found");
        return;
      }

      notifyMessagesChanged({ conversation_id: message.conversationId });
      sendJson(match.res, 200, serializeMessageWithDraft(updated, match.ctx));
    },
    { paramNames: ["messageId"] },
  ),

  route(
    "DELETE",
    /^\/api\/messages\/([^/]+)\/draft$/,
    { admin: true },
    async (match) => {
      const messageId = routeParam(match, "messageId");
      const message = requireMessage(match, messageId);
      if (!message) {
        return;
      }

      match.ctx.messageReplies.clearDraft(messageId);

      const sent = match.ctx.messageReplies.findLatestSentReply(messageId);
      if (!sent?.sentText) {
        if (message.status === "failed") {
          match.ctx.messages.markPending(messageId);
        }
      }

      const updated = match.ctx.messages.findById(messageId);
      if (!updated) {
        sendError(match.res, 404, "message not found");
        return;
      }

      notifyMessagesChanged({ conversation_id: message.conversationId });
      sendJson(match.res, 200, serializeMessageWithDraft(updated, match.ctx));
    },
    { paramNames: ["messageId"] },
  ),

  route(
    "POST",
    /^\/api\/messages\/([^/]+)\/approve-reply$/,
    { admin: true },
    async (match) => {
      const messageId = routeParam(match, "messageId");
      const message = requireMessage(match, messageId);
      if (!message) {
        return;
      }

      if (
        message.status !== "pending" &&
        message.status !== "replied" &&
        message.status !== "failed"
      ) {
        sendError(match.res, 422, "only pending, failed or replied messages can be approved");
        return;
      }

      const body = await readJsonBody<{ message?: unknown }>(match.req);
      const messageRecord = match.ctx.messages.findById(messageId)!;
      const resolvedDraft = resolveMessageDraftText(messageRecord, match.ctx);
      const text =
        typeof body.message === "string" && body.message.trim()
          ? body.message.trim()
          : resolvedDraft ?? "";

      if (!text) {
        throw new ValidationError("message or draft is required");
      }
      if (text.length > MAX_MESSAGE_REPLY_LENGTH) {
        throw new ValidationError(
          `message must be at most ${MAX_MESSAGE_REPLY_LENGTH} characters`,
        );
      }

      const readiness = getMetaReadiness(match.ctx);
      if (!readiness.ready) {
        sendMetaReadinessError(match.res, readiness);
        return;
      }

      const conversation = match.ctx.conversations.findById(message.conversationId);
      if (!conversation) {
        sendError(match.res, 404, "conversation not found");
        return;
      }

      assertCanReplyToConversation(match.ctx.messages, conversation.id);

      try {
        const publishResult = await match.ctx.metaMessageSender.sendText(
          conversation.participantIgUserId,
          text,
        );
        if (
          !match.ctx.messageReplies.promoteDraftToSent(
            messageId,
            text,
            publishResult?.publishedIgMessageId ?? null,
          )
        ) {
          match.ctx.messageReplies.createReply({
            messageId,
            sentText: text,
            status: "sent",
            sourceIgMessageId: publishResult?.publishedIgMessageId ?? null,
          });
        }
        match.ctx.messageReplies.clearDraft(messageId);
        const updated = match.ctx.messages.markReplied(messageId);
        notifyMessagesChanged({ conversation_id: message.conversationId });
        sendJson(match.res, 200, serializeMessageWithDraft(updated!, match.ctx));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "reply failed";
        match.ctx.messageReplies.createReply({
          messageId,
          sentText: text,
          status: "failed",
        });
        if (message.status !== "replied") {
          match.ctx.messages.markFailed(messageId, errorMessage);
        }
        notifyMessagesChanged({ conversation_id: message.conversationId });
        throw error;
      }
    },
    { paramNames: ["messageId"], errorOptions: { upstream502: true } },
  ),

  route(
    "POST",
    /^\/api\/messages\/([^/]+)\/reply$/,
    { admin: true },
    async (match) => {
      const messageId = routeParam(match, "messageId");
      const message = requireMessage(match, messageId);
      if (!message) {
        return;
      }

      if (message.status !== "pending") {
        sendError(match.res, 422, "only pending messages can be replied");
        return;
      }

      const body = await readJsonBody<{ message?: unknown }>(match.req);
      const text = typeof body.message === "string" ? body.message.trim() : "";
      if (!text) {
        throw new ValidationError("message is required");
      }
      if (text.length > MAX_MESSAGE_REPLY_LENGTH) {
        throw new ValidationError(
          `message must be at most ${MAX_MESSAGE_REPLY_LENGTH} characters`,
        );
      }

      const readiness = getMetaReadiness(match.ctx);
      if (!readiness.ready) {
        sendMetaReadinessError(match.res, readiness);
        return;
      }

      const conversation = match.ctx.conversations.findById(message.conversationId);
      if (!conversation) {
        sendError(match.res, 404, "conversation not found");
        return;
      }

      assertCanReplyToConversation(match.ctx.messages, conversation.id);

      try {
        const publishResult = await match.ctx.metaMessageSender.sendText(
          conversation.participantIgUserId,
          text,
        );
        match.ctx.messageReplies.createReply({
          messageId,
          sentText: text,
          status: "sent",
          sourceIgMessageId: publishResult?.publishedIgMessageId ?? null,
        });
        match.ctx.messageReplies.clearDraft(messageId);
        const updated = match.ctx.messages.markReplied(messageId);
        notifyMessagesChanged({ conversation_id: message.conversationId });
        sendJson(match.res, 200, serializeMessageWithDraft(updated!, match.ctx));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "reply failed";
        match.ctx.messageReplies.createReply({ messageId, sentText: text, status: "failed" });
        match.ctx.messages.markFailed(messageId, errorMessage);
        notifyMessagesChanged({ conversation_id: message.conversationId });
        throw error;
      }
    },
    { paramNames: ["messageId"], errorOptions: { upstream502: true } },
  ),
]);
