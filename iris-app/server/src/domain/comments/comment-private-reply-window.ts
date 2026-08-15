import type { Comment } from "./comment.ts";
import { resolveCommentOccurredAt } from "./comment-reply-max-age.ts";

/** Janela Meta para private reply a comentário (7 dias desde criação do comentário). */
export const META_PRIVATE_REPLY_WINDOW_DAYS = 7;

export function buildPrivateReplyWindowExpiredMessage(): string {
  return `[guardrail] private reply window expired (${META_PRIVATE_REPLY_WINDOW_DAYS} days)`.slice(
    0,
    500,
  );
}

export function isCommentWithinPrivateReplyWindow(
  comment: Comment,
  now: Date = new Date(),
): boolean {
  const occurredAt = resolveCommentOccurredAt(comment);
  if (Number.isNaN(occurredAt.getTime())) {
    return false;
  }

  const cutoffMs =
    now.getTime() - META_PRIVATE_REPLY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return occurredAt.getTime() >= cutoffMs;
}
