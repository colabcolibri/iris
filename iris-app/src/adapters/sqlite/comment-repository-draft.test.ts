import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";
import { createSqliteCommentRepository } from "./comment-repository.ts";

test("upsertDraft updates existing draft instead of inserting another row", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const comments = createSqliteCommentRepository(db);

    db.prepare(
      `INSERT INTO posts (id, status, channel, caption, created_at, updated_at)
       VALUES ('post-1', 'published', 'instagram', 'cap', datetime('now'), datetime('now'))`,
    ).run();

    db.prepare(
      `INSERT INTO comments (id, ig_comment_id, post_id, text, status, created_at)
       VALUES ('comment-1', 'ig-1', 'post-1', 'oi', 'pending', datetime('now'))`,
    ).run();

    comments.createReply({
      commentId: "comment-1",
      draftText: "rascunho original",
      status: "draft",
    });

    comments.upsertDraft("comment-1", "rascunho editado");

    const rows = db
      .prepare("SELECT draft_text, status FROM comment_replies WHERE comment_id = 'comment-1'")
      .all() as Array<{ draft_text: string | null; status: string }>;

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.draft_text, "rascunho editado");
    assert.equal(rows[0]?.status, "draft");
  } finally {
    db.close();
  }
});

test("upsertDraft creates draft when none exists", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const comments = createSqliteCommentRepository(db);

    db.prepare(
      `INSERT INTO posts (id, status, channel, caption, created_at, updated_at)
       VALUES ('post-1', 'published', 'instagram', 'cap', datetime('now'), datetime('now'))`,
    ).run();

    db.prepare(
      `INSERT INTO comments (id, ig_comment_id, post_id, text, status, created_at)
       VALUES ('comment-1', 'ig-1', 'post-1', 'oi', 'pending', datetime('now'))`,
    ).run();

    comments.upsertDraft("comment-1", "novo rascunho");

    const row = db
      .prepare("SELECT draft_text FROM comment_replies WHERE comment_id = 'comment-1' AND status = 'draft'")
      .get() as { draft_text: string | null };

    assert.equal(row.draft_text, "novo rascunho");
  } finally {
    db.close();
  }
});
