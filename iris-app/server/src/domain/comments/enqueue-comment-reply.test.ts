import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import { enqueueCommentReply } from "./enqueue-comment-reply.ts";
import { AGENT_REPLY_SUPERSEDED_REASON } from "../agent-reply/agent-reply-debounce.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import { createHarnessLlmMock } from "../../test-utils/harness-llm-mock.ts";

function withMockLlm(ctx: ReturnType<typeof createAppContext>): void {
  const llm = createHarnessLlmMock({ draftText: "ok" });
  (ctx as { resolveLlmCompleter: () => LlmCompleter | null }).resolveLlmCompleter = () => llm;
}

test("enqueueCommentReply schedules not_before from debounce settings", () => {
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
      autoMonitorEnabled: true,
      autoMonitorIntervalSeconds: 300,
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

test("enqueueCommentReply reschedules sliding debounce on repeat enqueue", () => {
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

    assert.equal(enqueueCommentReply(ctx, comment.id), true);

    const second = db
      .prepare("SELECT agent_reply_not_before FROM comments WHERE id = ?")
      .get(comment.id) as { agent_reply_not_before: string };
    assert.ok(second.agent_reply_not_before >= first.agent_reply_not_before);
  } finally {
    db.close();
  }
});

test("enqueueCommentReply supersedes older pending from same author on post", () => {
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

    const first = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-burst-1",
      postId: post.id,
      authorUsername: "ana",
      text: "oi",
      igTimestamp: "2026-08-14T10:00:00.000Z",
    }).comment;
    const second = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-burst-2",
      postId: post.id,
      authorUsername: "ana",
      text: "quanto custa?",
      igTimestamp: "2026-08-14T10:00:15.000Z",
    }).comment;

    withMockLlm(ctx);
    enqueueCommentReply(ctx, first.id);
    enqueueCommentReply(ctx, second.id);

    assert.equal(ctx.comments.findById(first.id)?.status, "skipped");
    assert.equal(ctx.comments.findById(first.id)?.errorMessage, AGENT_REPLY_SUPERSEDED_REASON);
    assert.equal(ctx.comments.findById(second.id)?.status, "pending");
  } finally {
    db.close();
  }
});

test("debounce keeps other authors pending on same post", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "d".repeat(64),
      metaAccessToken: "meta",
    });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      igMediaId: "media-4",
      publishedAt: new Date().toISOString(),
      replyMode: "auto",
    });

    const ana = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-ana",
      postId: post.id,
      authorUsername: "ana",
      text: "oi",
      igTimestamp: "2026-08-14T10:00:00.000Z",
    }).comment;
    const bob = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-bob",
      postId: post.id,
      authorUsername: "bob",
      text: "legal",
      igTimestamp: "2026-08-14T10:00:05.000Z",
    }).comment;

    withMockLlm(ctx);
    enqueueCommentReply(ctx, ana.id);
    enqueueCommentReply(ctx, bob.id);

    assert.equal(ctx.comments.findById(ana.id)?.status, "pending");
    assert.equal(ctx.comments.findById(bob.id)?.status, "pending");
  } finally {
    db.close();
  }
});
