import type { AppContext } from "../../api/app-context.ts";
import { getAppSettingsOrDefault } from "../../adapters/sqlite/app-settings-repository.ts";
import { computeAgentReplyNotBefore } from "../comments/compute-agent-reply-not-before.ts";
import {
  resolveConversationForAgentReply,
  shouldSkipAgentReplyForConversation,
} from "./conversation-agent-reply-guard.ts";
import {
  resolveEffectiveMessageReplyMode,
  shouldScheduleMessageReply,
} from "./message-reply-mode.ts";

export function enqueueMessageReply(ctx: AppContext, messageId: string): boolean {
  const message = ctx.messages.findById(messageId);
  if (!message || message.status !== "pending" || message.direction !== "inbound") {
    return false;
  }

  if (ctx.messageReplies.hasReplyRecord(messageId)) {
    return false;
  }

  const conversation = ctx.conversations.findById(message.conversationId);
  if (!conversation) {
    return false;
  }

  const resolvedConversation = resolveConversationForAgentReply(ctx, conversation);
  if (shouldSkipAgentReplyForConversation(ctx, resolvedConversation)) {
    return false;
  }

  const appSettings = getAppSettingsOrDefault(ctx.appSettingsStore);
  const effectiveReplyMode = resolveEffectiveMessageReplyMode(
    appSettings.messageReplyMode,
    conversation.replyMode,
  );

  if (!shouldScheduleMessageReply(effectiveReplyMode)) {
    return false;
  }

  if (!ctx.resolveLlmCompleter()) {
    return false;
  }

  const notBefore = computeAgentReplyNotBefore(
    new Date(),
    appSettings.messageReplyDelaySeconds,
  );
  return ctx.messages.scheduleAgentReply(messageId, notBefore);
}
