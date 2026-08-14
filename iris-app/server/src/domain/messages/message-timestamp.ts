import {
  commentTimestampToMs,
  normalizeCommentTimestamp,
} from "../comments/normalize-comment-timestamp.ts";

export const normalizeMessageTimestamp = normalizeCommentTimestamp;
export const messageTimestampToMs = commentTimestampToMs;

export function maxMessageTimestamp(
  current: string | null | undefined,
  candidate: string | null | undefined,
): string | null {
  const normalizedCandidate = normalizeMessageTimestamp(candidate);
  if (!normalizedCandidate) {
    return normalizeMessageTimestamp(current);
  }

  const normalizedCurrent = normalizeMessageTimestamp(current);
  if (!normalizedCurrent) {
    return normalizedCandidate;
  }

  return messageTimestampToMs(normalizedCandidate) >= messageTimestampToMs(normalizedCurrent)
    ? normalizedCandidate
    : normalizedCurrent;
}
