import { getOperatorNotificationSettingsOrDefault } from "../../adapters/sqlite/operator-notification-settings-repository.ts";
import type { AppContext } from "../../api/app-context.ts";
import type { Conversation } from "./conversation.ts";
import {
  isConversationAiLocked,
  refreshConversationAiLock,
} from "./conversation-ai-lock.ts";

export function resolveConversationForAgentReply(
  ctx: Pick<AppContext, "conversations" | "operatorNotificationSettingsStore">,
  conversation: Conversation,
  now: Date = new Date(),
): Conversation {
  const refreshed = refreshConversationAiLock(ctx.conversations, conversation, now);
  return refreshed;
}

export function shouldSkipAgentReplyForConversation(
  ctx: Pick<AppContext, "conversations" | "operatorNotificationSettingsStore">,
  conversation: Conversation,
  now: Date = new Date(),
): boolean {
  const resolved = resolveConversationForAgentReply(ctx, conversation, now);
  return isConversationAiLocked(resolved, now);
}

export function readAiLockDaysFromSettings(
  ctx: Pick<AppContext, "operatorNotificationSettingsStore">,
): number {
  return getOperatorNotificationSettingsOrDefault(ctx.operatorNotificationSettingsStore)
    .aiLockDays;
}
