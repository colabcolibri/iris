import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqlitePostRepository } from "../../adapters/sqlite/post-repository.ts";
import { createSqliteCommentRepository } from "../../adapters/sqlite/comment-repository.ts";

test("upsertFromWebhook stores instagram timestamp separately from created_at", () => {
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

    const { comment } = comments.upsertFromWebhook({
      igCommentId: "ig-comment-1",
      postId: post.id,
      text: "oi",
      igTimestamp: "2026-08-10T09:15:00+0000",
    });

    assert.equal(comment.igTimestamp, "2026-08-10T09:15:00.000Z");
    assert.notEqual(comment.createdAt, comment.igTimestamp);
  } finally {
    db.close();
  }
});

test("upsertFromWebhook updates ig_timestamp on resync with instagram time", () => {
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

    comments.upsertFromWebhook({
      igCommentId: "ig-comment-2",
      postId: post.id,
      text: "oi",
    });

    const updated = comments.upsertFromWebhook({
      igCommentId: "ig-comment-2",
      postId: post.id,
      text: "oi",
      igTimestamp: "2026-08-10T11:20:00+0000",
    });

    assert.equal(updated.comment.igTimestamp, "2026-08-10T11:20:00.000Z");
  } finally {
    db.close();
  }
});
