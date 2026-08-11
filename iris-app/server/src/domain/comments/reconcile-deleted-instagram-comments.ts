import type { Comment } from "./comment.ts";

export type ReconcileDeletedInstagramCommentsDeps = {
  listByPostId: (postId: string) => Comment[];
  markDeletedFromInstagram: (commentId: string) => boolean;
  restoreFromInstagram: (commentId: string) => boolean;
};

export type ReconcileDeletedInstagramCommentsResult = {
  markedDeleted: number;
  restored: number;
};

export function reconcileDeletedInstagramComments(
  postId: string,
  remoteIgCommentIds: ReadonlySet<string>,
  deps: ReconcileDeletedInstagramCommentsDeps,
  options: { accessLimited: boolean },
): ReconcileDeletedInstagramCommentsResult {
  if (options.accessLimited) {
    return { markedDeleted: 0, restored: 0 };
  }

  let markedDeleted = 0;
  let restored = 0;

  for (const comment of deps.listByPostId(postId)) {
    const onInstagram = remoteIgCommentIds.has(comment.igCommentId);

    if (comment.deletedAt && onInstagram) {
      if (deps.restoreFromInstagram(comment.id)) {
        restored += 1;
      }
      continue;
    }

    if (!comment.deletedAt && !onInstagram) {
      if (deps.markDeletedFromInstagram(comment.id)) {
        markedDeleted += 1;
      }
    }
  }

  return { markedDeleted, restored };
}
