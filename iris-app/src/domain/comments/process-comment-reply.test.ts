import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import { registerMonitoredPost } from "./register-monitored-post.ts";
import { processCommentReply } from "./process-comment-reply.ts";
import { createHarnessLlmMock } from "../../test-utils/harness-llm-mock.ts";

test("registerMonitoredPost creates monitored post from ig_media_id", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "a".repeat(64),
      metaAccessToken: "meta",
    });

    const post = await registerMonitoredPost(
      { ig_media_id: "17841400000000001" },
      {
        posts: ctx.posts,
        metaCommentReader: {
          async listRecentMediaWithComments() {
            return [];
          },
          async fetchMediaMetadata(igMediaId) {
            return {
              igMediaId,
              caption: "Post externo",
              timestamp: "2026-08-10T10:00:00.000Z",
            };
          },
          async findMediaByPermalink() {
            return null;
          },
        },
      },
    );

    assert.equal(post.status, "monitored");
    assert.equal(post.igMediaId, "17841400000000001");
    assert.equal(post.caption, "Post externo");
  } finally {
    db.close();
  }
});

test("processCommentReply stores draft without calling Meta", async () => {
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
      caption: "Post",
      igMediaId: "media-1",
      publishedAt: new Date().toISOString(),
      replyMode: "draft",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-draft-1",
      postId: post.id,
      text: "Pergunta",
    });

    let metaCalled = false;
    ctx.metaCommentReplier = {
      async reply() {
        metaCalled = true;
      },
    };

    await processCommentReply(ctx, comment.id, {
      trigger: "webhook",
      llmCompleter: createHarnessLlmMock({ draftText: "Rascunho da IA" }),
    });

    assert.equal(metaCalled, false);
    assert.equal(ctx.comments.findLatestDraft(comment.id)?.draftText, "Rascunho da IA");
    assert.equal(ctx.comments.findById(comment.id)?.status, "pending");

    const steps = ctx.agentRunSteps.listByCommentId(comment.id);
    assert.equal(steps.length, 3);
  } finally {
    db.close();
  }
});

test("processCommentReply skips posts with reply_mode off", async () => {
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
      igMediaId: "media-off",
      publishedAt: new Date().toISOString(),
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-off-1",
      postId: post.id,
      text: "oi",
    });

    let llmCalled = false;
    const processed = await processCommentReply(ctx, comment.id, {
      trigger: "worker",
      llmCompleter: {
        async complete() {
          llmCalled = true;
          return "nope";
        },
      },
    });

    assert.equal(processed, false);
    assert.equal(llmCalled, false);
  } finally {
    db.close();
  }
});

test("processCommentReply skips when global auto_reply is disabled", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "d".repeat(64),
      metaAccessToken: "meta",
    });

    ctx.appSettingsStore.upsert({
      timezone: "America/Sao_Paulo",
      autoReplyEnabled: false,
    });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post",
      igMediaId: "media-global-off",
      publishedAt: new Date().toISOString(),
      replyMode: "auto",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-global-off-1",
      postId: post.id,
      text: "oi",
    });

    let llmCalled = false;
    const processed = await processCommentReply(ctx, comment.id, {
      trigger: "worker",
      llmCompleter: {
        async complete() {
          llmCalled = true;
          return "nope";
        },
      },
    });

    assert.equal(processed, false);
    assert.equal(llmCalled, false);
  } finally {
    db.close();
  }
});
