import { test } from "node:test";
import assert from "node:assert/strict";
import { refreshAndReconcilePostComments } from "./refresh-and-reconcile-post-comments.ts";
import type { Comment } from "./comment.ts";

test("refreshAndReconcilePostComments sincroniza antes de vincular", async () => {
  const postId = "post-1";
  const igMediaId = "media-1";
  const store = new Map<string, Comment>();

  const sync = await refreshAndReconcilePostComments({
    postId,
    igMediaId,
    brandUsername: "colabcolibri",
    replyMaxAgeDays: 15,
    syncDeps: {
      posts: { update: () => null } as never,
      metaCommentReader: {
        async listRecentMediaWithComments() {
          return [
            {
              igMediaId,
              caption: null,
              timestamp: new Date().toISOString(),
              likeCount: null,
              reportedCommentsCount: 1,
              comments: [
                {
                  igCommentId: "ig-u1",
                  parentIgCommentId: null,
                  authorUsername: "fan",
                  text: "oi",
                  timestamp: "2026-08-10T10:00:00.000Z",
                },
              ],
            },
          ];
        },
      },
      upsertFromWebhook: (input) => {
        const comment: Comment = {
          id: "u1",
          igCommentId: input.igCommentId,
          postId: input.postId,
          parentIgCommentId: input.parentIgCommentId ?? null,
          authorUsername: input.authorUsername ?? null,
          text: input.text ?? null,
          status: "pending",
          errorMessage: null,
          createdAt: "2026-08-10T10:00:00.000Z",
          igTimestamp: input.igTimestamp ?? null,
          deletedAt: null,
        };
        store.set(comment.id, comment);
        return { comment, created: true };
      },
      listByPostId: () => [...store.values()],
      markDeletedFromInstagram: (id) => {
        const row = store.get(id);
        if (!row || row.deletedAt) return false;
        store.set(id, { ...row, deletedAt: "2026-08-10T12:00:00.000Z" });
        return true;
      },
      restoreFromInstagram: () => false,
    },
    reconcileDeps: {
      listByPostId: () => [...store.values()],
      hasReplyRecord: () => false,
      linkInstagramReply: () => false,
      markSkipped: () => null,
    },
  });

  assert.equal(sync.sync.commentsFetched, 1);
  assert.equal(sync.reconcile.linkedCount, 0);
  assert.equal(store.size, 1);
});
