import type { Comment } from "../comment.ts";
import {
  reconcileCommentThreadStatuses,
  type ReconcileCommentThreadResult,
  type ReconcileCommentThreadStatusesDeps,
} from "./reconcile-comment-thread-statuses.ts";
import {
  syncPostComments,
  type SyncPostCommentsDeps,
  type SyncPostCommentsResult,
} from "./sync-post-comments.ts";

export type RefreshAndReconcilePostCommentsInput = {
  postId: string;
  igMediaId: string;
  brandUsername: string | null | undefined;
  syncDeps: SyncPostCommentsDeps;
  reconcileDeps: ReconcileCommentThreadStatusesDeps;
};

export type RefreshAndReconcilePostCommentsResult = {
  sync: SyncPostCommentsResult;
  reconcile: ReconcileCommentThreadResult;
  comments: Comment[];
};

/** Sincroniza comentários com a Meta (inclui marcar removidos) e vincula respostas da marca no thread. */
export async function refreshAndReconcilePostComments(
  input: RefreshAndReconcilePostCommentsInput,
): Promise<RefreshAndReconcilePostCommentsResult> {
  const sync = await syncPostComments(
    { postId: input.postId, igMediaId: input.igMediaId },
    input.syncDeps,
  );

  const reconcile = reconcileCommentThreadStatuses(
    input.postId,
    input.brandUsername,
    input.reconcileDeps,
  );

  const comments = input.syncDeps.listByPostId(input.postId);

  return { sync, reconcile, comments };
}
