import type { Conversation } from "./conversation.ts";
import type { ConversationRepository } from "../../ports/conversation-repository.ts";

export const DEFAULT_AI_LOCK_DAYS = 5;
export const OPERATOR_ESCALATION_LOCK_REASON = "operator_escalation";

export function normalizeAiLockDays(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return DEFAULT_AI_LOCK_DAYS;
  }
  return Math.min(value, 90);
}

export function isConversationAiLocked(
  conversation: Pick<Conversation, "aiLockedUntil">,
  now: Date = new Date(),
): boolean {
  if (!conversation.aiLockedUntil) {
    return false;
  }
  return new Date(conversation.aiLockedUntil).getTime() > now.getTime();
}

export function isConversationAiLockExpired(
  conversation: Pick<Conversation, "aiLockedUntil">,
  now: Date = new Date(),
): boolean {
  if (!conversation.aiLockedUntil) {
    return false;
  }
  return new Date(conversation.aiLockedUntil).getTime() <= now.getTime();
}

export function computeAiLockUntil(now: Date, lockDays: number): string {
  const until = new Date(now);
  until.setUTCDate(until.getUTCDate() + normalizeAiLockDays(lockDays));
  return until.toISOString();
}

export function refreshConversationAiLock(
  conversations: ConversationRepository,
  conversation: Conversation,
  now: Date = new Date(),
): Conversation {
  if (!isConversationAiLockExpired(conversation, now)) {
    return conversation;
  }
  return conversations.unlockAi(conversation.id) ?? conversation;
}

export function lockConversationAfterOperatorEscalation(
  conversations: ConversationRepository,
  conversationId: string,
  lockDays: number,
  now: Date = new Date(),
): Conversation | null {
  return conversations.lockAi(conversationId, {
    lockedUntil: computeAiLockUntil(now, lockDays),
    lockedAt: now.toISOString(),
    reason: OPERATOR_ESCALATION_LOCK_REASON,
  });
}
