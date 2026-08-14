import type { Comment } from "./comment.ts";

export function buildCommentTooOldMessage(maxAgeDays: number): string {
  return `[guardrail] comment older than ${maxAgeDays} days`.slice(0, 500);
}

export function resolveCommentOccurredAt(comment: Comment): Date {
  return new Date(comment.igTimestamp ?? comment.createdAt);
}

export function isCommentWithinReplyMaxAge(
  comment: Comment,
  maxAgeDays: number,
  now: Date = new Date(),
): boolean {
  const occurredAt = resolveCommentOccurredAt(comment);
  if (Number.isNaN(occurredAt.getTime())) {
    return false;
  }

  const cutoffMs = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000;
  return occurredAt.getTime() >= cutoffMs;
}
