import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import { enqueueCommentReply } from "./enqueue-comment-reply.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import { createHarnessLlmMock } from "../../test-utils/harness-llm-mock.ts";

function withMockLlm(ctx: ReturnType<typeof createAppContext>): void {
  const llm = createHarnessLlmMock({ draftText: "ok" });
  (ctx as { resolveLlmCompleter: () => LlmCompleter | null }).resolveLlmCompleter = () => llm;
}

test("enqueueCommentReply schedules not_before from reply delay settings", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "a".repeat(64),
      metaAccessToken: "meta",
    });

    ctx.appSettingsStore.upsert({
      timezone: "America/Sao_Paulo",
      replyMode: "auto",
      autoReplyEnabled: true,
      replyDelaySeconds: 90,
    });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      igMediaId: "media-1",
      publishedAt: new Date().toISOString(),
      replyMode: "auto",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-delay-1",
      postId: post.id,
      text: "oi",
    });

    withMockLlm(ctx);

    const scheduled = enqueueCommentReply(ctx, comment.id);
    assert.equal(scheduled, true);

    assert.equal(ctx.comments.listPendingForAgentReply().length, 0);

    const row = db
      .prepare("SELECT agent_reply_not_before FROM comments WHERE id = ?")
      .get(comment.id) as { agent_reply_not_before: string };
    assert.ok(row.agent_reply_not_before);
  } finally {
    db.close();
  }
});

test("enqueueCommentReply is idempotent when not_before already set", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "b".repeat(64),
      metaAccessToken: "meta",
    });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      igMediaId: "media-2",
      publishedAt: new Date().toISOString(),
      replyMode: "auto",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-delay-2",
      postId: post.id,
      text: "oi",
    });

    withMockLlm(ctx);

    assert.equal(enqueueCommentReply(ctx, comment.id), true);
    const first = db
      .prepare("SELECT agent_reply_not_before FROM comments WHERE id = ?")
      .get(comment.id) as { agent_reply_not_before: string };

    assert.equal(enqueueCommentReply(ctx, comment.id), false);

    const second = db
      .prepare("SELECT agent_reply_not_before FROM comments WHERE id = ?")
      .get(comment.id) as { agent_reply_not_before: string };
    assert.equal(second.agent_reply_not_before, first.agent_reply_not_before);
  } finally {
    db.close();
  }
});

test("delay 0 makes comment due for agent reply immediately", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "c".repeat(64),
      metaAccessToken: "meta",
    });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      igMediaId: "media-3",
      publishedAt: new Date().toISOString(),
      replyMode: "auto",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-immediate-1",
      postId: post.id,
      text: "oi",
    });

    withMockLlm(ctx);
    enqueueCommentReply(ctx, comment.id);

    assert.equal(ctx.comments.listPendingForAgentReply().length, 1);
  } finally {
    db.close();
  }
});
