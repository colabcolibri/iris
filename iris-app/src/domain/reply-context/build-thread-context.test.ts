import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqlitePostRepository } from "../../adapters/sqlite/post-repository.ts";
import { createSqliteCommentRepository } from "../../adapters/sqlite/comment-repository.ts";
import { buildCommentThreadContext } from "./build-thread-context.ts";

test("buildCommentThreadContext includes comments and brand replies", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const comments = createSqliteCommentRepository(db);

    const post = posts.create({ channel: "instagram", caption: "x" });

    const first = comments.upsertFromWebhook({
      igCommentId: "ig-1",
      postId: post.id,
      authorUsername: "fan",
      text: "Primeiro",
    }).comment;

    const second = comments.upsertFromWebhook({
      igCommentId: "ig-2",
      postId: post.id,
      authorUsername: "fan2",
      text: "Segundo",
    }).comment;

    comments.createReply(first.id, "Resposta da marca", "sent");

    const thread = buildCommentThreadContext(second.id, { comments });
    assert.ok(thread);
    assert.ok(thread!.entries.length >= 3);
    assert.ok(thread!.entries.some((e) => e.isBrandReply && e.text === "Resposta da marca"));
  } finally {
    db.close();
  }
});
