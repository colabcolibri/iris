import type { Comment } from "./comment.ts";
import {
  buildCommentTooOldMessage,
  isCommentWithinReplyMaxAge,
} from "./comment-reply-max-age.ts";
import { isBrandAuthor } from "./is-brand-author.ts";

export type SkipStalePendingCommentsDeps = {
  listByPostId: (postId: string) => Comment[];
  markSkipped: (id: string, errorMessage?: string | null) => Comment | null;
  replyMaxAgeDays: number;
};

export function skipStalePendingCommentsForPost(
  postId: string,
  brandUsername: string | null | undefined,
  deps: SkipStalePendingCommentsDeps,
): number {
  const brand = brandUsername?.trim() || null;
  let skipped = 0;

  for (const comment of deps.listByPostId(postId)) {
    if (comment.status !== "pending" || comment.deletedAt) {
      continue;
    }

    if (isBrandAuthor(comment.authorUsername, brand)) {
      continue;
    }

    if (isCommentWithinReplyMaxAge(comment, deps.replyMaxAgeDays)) {
      continue;
    }

    deps.markSkipped(comment.id, buildCommentTooOldMessage(deps.replyMaxAgeDays));
    skipped += 1;
  }

  return skipped;
}
