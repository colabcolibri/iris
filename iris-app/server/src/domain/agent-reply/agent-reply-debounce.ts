import type { Comment } from "../comments/comment.ts";
import type { Message } from "../messages/message.ts";

/** Piso fixo — sempre aplicado, mesmo com setting menor. */
export const AGENT_REPLY_DEBOUNCE_MIN_SECONDS = 30;
/** Teto configurável (3 minutos). */
export const AGENT_REPLY_DEBOUNCE_MAX_SECONDS = 180;
export const AGENT_REPLY_DEBOUNCE_DEFAULT_SECONDS = 30;

export const AGENT_REPLY_SUPERSEDED_REASON =
  "[debounce] superseded by newer inbound";
export const AGENT_REPLY_EDIT_SKIP_REASON = "[edit] content changed after ingest";

export function normalizeAgentReplyDebounceSeconds(value: number): number {
  if (!Number.isFinite(value)) {
    return AGENT_REPLY_DEBOUNCE_DEFAULT_SECONDS;
  }
  const rounded = Math.round(value);
  if (rounded < AGENT_REPLY_DEBOUNCE_MIN_SECONDS) {
    return AGENT_REPLY_DEBOUNCE_MIN_SECONDS;
  }
  return Math.min(AGENT_REPLY_DEBOUNCE_MAX_SECONDS, rounded);
}

export function isValidAgentReplyDebounceSeconds(value: number): boolean {
  if (!Number.isFinite(value)) {
    return false;
  }
  const rounded = Math.round(value);
  return (
    rounded >= AGENT_REPLY_DEBOUNCE_MIN_SECONDS &&
    rounded <= AGENT_REPLY_DEBOUNCE_MAX_SECONDS
  );
}

export function computeAgentReplyDebounceNotBefore(
  now: Date,
  debounceSeconds: number,
): string {
  const delay = normalizeAgentReplyDebounceSeconds(debounceSeconds);
  return new Date(now.getTime() + delay * 1000).toISOString();
}

export function messageActivityTimestamp(message: Message): string {
  return message.igTimestamp ?? message.createdAt;
}

export function commentActivityTimestamp(comment: Comment): string {
  return comment.igTimestamp ?? comment.createdAt;
}

export function isOlderMessage(candidate: Message, keep: Message): boolean {
  const candidateAt = messageActivityTimestamp(candidate);
  const keepAt = messageActivityTimestamp(keep);
  const byTime = candidateAt.localeCompare(keepAt);
  if (byTime !== 0) {
    return byTime < 0;
  }
  return candidate.createdAt.localeCompare(keep.createdAt) < 0;
}

export function isOlderComment(candidate: Comment, keep: Comment): boolean {
  const candidateAt = commentActivityTimestamp(candidate);
  const keepAt = commentActivityTimestamp(keep);
  const byTime = candidateAt.localeCompare(keepAt);
  if (byTime !== 0) {
    return byTime < 0;
  }
  return candidate.createdAt.localeCompare(keep.createdAt) < 0;
}

export function normalizeCommentAuthorKey(authorUsername: string | null): string {
  return (authorUsername ?? "").trim().toLowerCase();
}

export function pickLatestPendingMessagePerConversation<T extends Message>(
  pending: T[],
): T[] {
  const latestByConversation = new Map<string, T>();

  for (const message of pending) {
    const existing = latestByConversation.get(message.conversationId);
    if (!existing || isOlderMessage(existing, message)) {
      latestByConversation.set(message.conversationId, message);
    }
  }

  return Array.from(latestByConversation.values());
}

export function pickLatestPendingCommentPerAuthorOnPost<T extends Comment>(
  pending: T[],
): T[] {
  const latestByAuthor = new Map<string, T>();

  for (const comment of pending) {
    const key = `${comment.postId}::${normalizeCommentAuthorKey(comment.authorUsername)}`;
    const existing = latestByAuthor.get(key);
    if (!existing || isOlderComment(existing, comment)) {
      latestByAuthor.set(key, comment);
    }
  }

  return Array.from(latestByAuthor.values());
}
