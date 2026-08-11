import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqlitePostRepository } from "../../adapters/sqlite/post-repository.ts";
import { createSqliteCommentRepository } from "../../adapters/sqlite/comment-repository.ts";
import { syncPostComments } from "./sync-post-comments.ts";
import { reconcileCommentThreadStatuses } from "./reconcile-comment-thread-statuses.ts";

test("syncPostComments does not schedule agent replies and reconcile links existing brand answers", async () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const comments = createSqliteCommentRepository(db);

    const post = posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post",
    });
    posts.update(post.id, { igMediaId: "media-1", replyMode: "auto" });

    await syncPostComments(
      { postId: post.id, igMediaId: "media-1" },
      {
        metaCommentReader: {
          async listRecentMediaWithComments() {
            return [
              {
                igMediaId: "media-1",
                caption: "Legenda",
                timestamp: "2026-08-10T10:00:00+0000",
                reportedCommentsCount: 2,
                comments: [
                  {
                    igCommentId: "ig-user",
                    parentIgCommentId: null,
                    authorUsername: "fan",
                    text: "pergunta antiga",
                    timestamp: "2026-08-10T10:00:00+0000",
                  },
                  {
                    igCommentId: "ig-brand",
                    parentIgCommentId: "ig-user",
                    authorUsername: "colabcolibri",
                    text: "resposta manual",
                    timestamp: "2026-08-10T10:05:00+0000",
                  },
                ],
              },
            ];
          },
          async fetchMediaMetadata(igMediaId: string) {
            return { igMediaId, caption: null, timestamp: null };
          },
          async fetchMediaPreview(igMediaId: string) {
            return { permalink: null, mediaType: null, slides: [] };
          },
          async listBrowsableMedia() {
            return { items: [], nextCursor: null };
          },
          async findMediaByPermalink() {
            return null;
          },
          async fetchCommentTimestamp() {
            return null;
          },
        },
        upsertFromWebhook: (input) => comments.upsertFromWebhook(input),
      },
    );

    const pendingBeforeReconcile = comments.listPendingForAgentReply();
    assert.equal(pendingBeforeReconcile.length, 0);

    const userBefore = comments.findByIgCommentId("ig-user");
    assert.equal(userBefore?.status, "pending");

    reconcileCommentThreadStatuses(post.id, "colabcolibri", {
      listByPostId: (postId) => comments.listByPostId(postId),
      hasReplyRecord: (commentId) => comments.hasReplyRecord(commentId),
      linkInstagramReply: (input) => comments.linkInstagramReply(input),
      markSkipped: (id) => comments.markSkipped(id),
    });

    const userAfter = comments.findByIgCommentId("ig-user");
    assert.equal(userAfter?.status, "replied");
    assert.equal(comments.hasReplyRecord(userAfter!.id), true);
    assert.equal(comments.listPendingForAgentReply().length, 0);
  } finally {
    db.close();
  }
});
