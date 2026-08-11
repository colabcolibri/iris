import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import { enqueueSchedulablePendingComments } from "./enqueue-schedulable-pending-comments.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import { createHarnessLlmMock } from "../../test-utils/harness-llm-mock.ts";

function withMockLlm(ctx: ReturnType<typeof createAppContext>): void {
  const llm = createHarnessLlmMock({ draftText: "ok" });
  (ctx as { resolveLlmCompleter: () => LlmCompleter | null }).resolveLlmCompleter = () => llm;
}

test("enqueueSchedulablePendingComments schedules pending comments when post inherits global auto", () => {
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
      replyDelaySeconds: 0,
      autoMonitorEnabled: true,
      autoMonitorIntervalSeconds: 300,
    });
    withMockLlm(ctx);

    const post = ctx.posts.create({
      channel: "instagram",
      status: "monitored",
      caption: "Externo",
      igMediaId: "media-1",
      publishedAt: new Date().toISOString(),
      replyMode: "inherit",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-1",
      postId: post.id,
      authorUsername: "fan",
      text: "Oi",
    });

    assert.equal(ctx.comments.listPendingForAgentReply().length, 0);

    const enqueued = enqueueSchedulablePendingComments(ctx, { postId: post.id });
    assert.equal(enqueued, 1);
    assert.equal(ctx.comments.listPendingForAgentReply().length, 1);
    assert.equal(ctx.comments.listPendingForAgentReply()[0]?.id, comment.id);
  } finally {
    db.close();
  }
});

test("enqueueSchedulablePendingComments ignores posts with reply_mode off", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "c".repeat(64),
      metaAccessToken: "meta",
    });

    ctx.appSettingsStore.upsert({
      timezone: "America/Sao_Paulo",
      replyMode: "auto",
      autoReplyEnabled: true,
      replyDelaySeconds: 0,
      autoMonitorEnabled: true,
      autoMonitorIntervalSeconds: 300,
    });
    withMockLlm(ctx);

    const post = ctx.posts.create({
      channel: "instagram",
      status: "monitored",
      caption: "Externo",
      igMediaId: "media-off",
      publishedAt: new Date().toISOString(),
      replyMode: "off",
    });

    ctx.comments.upsertFromWebhook({
      igCommentId: "ig-off",
      postId: post.id,
      authorUsername: "fan",
      text: "Oi",
    });

    const enqueued = enqueueSchedulablePendingComments(ctx, { postId: post.id });
    assert.equal(enqueued, 0);
    assert.equal(ctx.comments.listPendingForAgentReply().length, 0);
  } finally {
    db.close();
  }
});
