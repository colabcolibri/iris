import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../adapters/sqlite/connection.ts";
import { runMigrations } from "../adapters/sqlite/migrate.ts";
import { createAppContext } from "../api/app-context.ts";
import { startCommentResponder } from "./comment-responder.ts";

test("comment responder replies to pending comments with auto_reply enabled", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);

    const ctx = createAppContext({
      db,
      adminToken: "admin",
      agentToken: "agent",
      encryptionKey: "f".repeat(64),
      metaAccessToken: "meta",
    });

    const post = ctx.posts.create({ channel: "instagram", caption: "Post caption" });
    ctx.posts.update(post.id, { autoReplyEnabled: true });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-c-1",
      postId: post.id,
      text: "Quanto custa?",
      authorUsername: "lead",
    });

    const replies: string[] = [];

    ctx.metaCommentReplier = {
      async reply(_igCommentId, message) {
        replies.push(message);
      },
    };

    ctx.llmCompleter = {
      async complete() {
        return "Obrigado pelo interesse!";
      },
    };

    const stop = startCommentResponder(ctx, { intervalMs: 50 });
    await new Promise((resolve) => setTimeout(resolve, 120));
    stop();

    const updated = ctx.comments.findById(comment.id);
    assert.equal(updated?.status, "replied");
    assert.equal(replies.length, 1);

    const runs = db.prepare("SELECT COUNT(*) AS total FROM agent_runs").get() as {
      total: number;
    };
    assert.equal(runs.total, 1);
  } finally {
    db.close();
  }
});

test("comment responder ignores posts without auto_reply", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);

    const ctx = createAppContext({
      db,
      adminToken: "admin",
      agentToken: "agent",
      encryptionKey: "f".repeat(64),
      metaAccessToken: "meta",
    });

    const post = ctx.posts.create({ channel: "instagram" });
    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-c-2",
      postId: post.id,
      text: "oi",
    });

    let called = false;
    ctx.metaCommentReplier = {
      async reply() {
        called = true;
      },
    };
    ctx.llmCompleter = {
      async complete() {
        return "ok";
      },
    };

    const stop = startCommentResponder(ctx, { intervalMs: 50 });
    await new Promise((resolve) => setTimeout(resolve, 120));
    stop();

    assert.equal(called, false);
    assert.equal(ctx.comments.findById(comment.id)?.status, "pending");
  } finally {
    db.close();
  }
});
