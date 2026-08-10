import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqlitePostRepository } from "../../adapters/sqlite/post-repository.ts";
import { createSqliteCommentRepository } from "../../adapters/sqlite/comment-repository.ts";
import { buildCommentThreadContext } from "./build-thread-context.ts";

test("buildCommentThreadContext includes branch with brand reply", () => {
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

    comments.upsertFromWebhook({
      igCommentId: "ig-2",
      postId: post.id,
      parentIgCommentId: "ig-1",
      authorUsername: "fan2",
      text: "Segundo",
    }).comment;

    comments.upsertFromWebhook({
      igCommentId: "ig-3",
      postId: post.id,
      authorUsername: "outro",
      text: "Irrelevante",
    }).comment;

    comments.createReply(first.id, "Resposta da marca", "sent");

    const second = comments.findByIgCommentId("ig-2");
    assert.ok(second);

    const thread = buildCommentThreadContext(second!.id, { comments });
    assert.ok(thread);
    assert.equal(thread!.entries.some((entry) => entry.text === "Irrelevante"), false);
    assert.ok(thread!.entries.some((entry) => entry.isBrandReply && entry.text === "Resposta da marca"));
    assert.ok(thread!.entries.some((entry) => entry.text === "Segundo" && entry.depth === 1));
  } finally {
    db.close();
  }
});
