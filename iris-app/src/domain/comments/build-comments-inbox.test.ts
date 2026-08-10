import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqlitePostRepository } from "../../adapters/sqlite/post-repository.ts";
import { createSqliteCommentRepository } from "../../adapters/sqlite/comment-repository.ts";
import { buildCommentsInbox } from "./build-comments-inbox.ts";

test("buildCommentsInbox syncs comments for iris posts", async () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const comments = createSqliteCommentRepository(db);

    const post = posts.create({
      channel: "instagram",
      status: "published",
      caption: "Legenda",
    });
    posts.update(post.id, { igMediaId: "media-sync" });

    const inbox = await buildCommentsInbox(30, {
      metaCommentReader: {
        async listRecentMediaWithComments() {
          return [
            {
              igMediaId: "media-sync",
              caption: "Legenda",
              timestamp: new Date().toISOString(),
              reportedCommentsCount: 1,
              comments: [
                {
                  igCommentId: "ig-sync-1",
                  parentIgCommentId: null,
                  authorUsername: "fan",
                  text: "sync",
                  timestamp: new Date().toISOString(),
                },
              ],
            },
            {
              igMediaId: "media-external",
              caption: null,
              timestamp: new Date().toISOString(),
              reportedCommentsCount: 3,
              comments: [],
            },
          ];
        },
      },
      findPostIdByIgMediaId: (igMediaId) => posts.findByIgMediaId(igMediaId)?.id ?? null,
      upsertFromWebhook: (input) => comments.upsertFromWebhook(input),
      findByIgCommentId: (igCommentId) => comments.findByIgCommentId(igCommentId),
    });

    assert.equal(inbox.media.length, 2);
    assert.equal(inbox.media[0]?.postId, post.id);
    assert.ok(inbox.media[0]?.comments[0]?.irisCommentId);
    assert.equal(inbox.media[1]?.postId, null);
    assert.equal(inbox.media[1]?.comments.length, 0);
    assert.equal(inbox.media[1]?.reportedCommentsCount, 3);
    assert.equal(inbox.summary.comments_reported, 4);
    assert.equal(inbox.summary.access_limited, false);
  } finally {
    db.close();
  }
});

test("buildCommentsInbox flags meta access limitation when counts exist but list is empty", async () => {
  const inbox = await buildCommentsInbox(30, {
    metaCommentReader: {
      async listRecentMediaWithComments() {
        return [
          {
            igMediaId: "media-blocked",
            caption: "Post com comentários",
            timestamp: new Date().toISOString(),
            reportedCommentsCount: 2,
            comments: [],
          },
        ];
      },
    },
    findPostIdByIgMediaId: () => null,
    upsertFromWebhook: () => {
      throw new Error("should not upsert");
    },
    findByIgCommentId: () => null,
  });

  assert.equal(inbox.media.length, 1);
  assert.equal(inbox.summary.comments_reported, 2);
  assert.equal(inbox.summary.comments_fetched, 0);
  assert.equal(inbox.summary.access_limited, true);
  assert.ok(inbox.summary.warning);
});
