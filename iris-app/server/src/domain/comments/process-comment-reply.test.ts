import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import { registerMonitoredPost } from "./register-monitored-post.ts";
import { processCommentReply } from "./process-comment-reply.ts";
import { createHarnessLlmMock } from "../../test-utils/harness-llm-mock.ts";
import { createTestLlmCompletion } from "../../ports/llm-completer.ts";

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
    assert.equal(post.replyMode, "inherit");
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
      replyMode: "off",
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
          return createTestLlmCompletion("nope");
        },
      },
    });

    assert.equal(processed, false);
    assert.equal(llmCalled, false);
  } finally {
    db.close();
  }
});

test("processCommentReply skips when global is off and post inherits", async () => {
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
      replyMode: "off",
      autoReplyEnabled: false,
      replyDelaySeconds: 0,
      autoMonitorEnabled: true,
      autoMonitorIntervalSeconds: 300,
    });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post",
      igMediaId: "media-global-off",
      publishedAt: new Date().toISOString(),
      replyMode: "inherit",
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
          return createTestLlmCompletion("nope");
        },
      },
    });

    assert.equal(processed, false);
    assert.equal(llmCalled, false);
  } finally {
    db.close();
  }
});

test("processCommentReply honors explicit post auto when global is off", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "e".repeat(64),
      metaAccessToken: "meta",
    });

    ctx.appSettingsStore.upsert({
      timezone: "America/Sao_Paulo",
      replyMode: "off",
      autoReplyEnabled: false,
      replyDelaySeconds: 0,
      autoMonitorEnabled: true,
      autoMonitorIntervalSeconds: 300,
    });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post",
      igMediaId: "media-post-auto",
      publishedAt: new Date().toISOString(),
      replyMode: "auto",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-post-auto-1",
      postId: post.id,
      text: "oi",
    });

    let llmCalled = false;
    const llm = createHarnessLlmMock({ draftText: "Resposta" });
    const originalComplete = llm.complete.bind(llm);
    llm.complete = async (...args) => {
      llmCalled = true;
      return originalComplete(...args);
    };

    await processCommentReply(ctx, comment.id, {
      trigger: "worker",
      llmCompleter: llm,
      metaCommentReplier: {
        async reply() {
          return { publishedIgCommentId: "reply-1" };
        },
      },
    });

    assert.equal(llmCalled, true);
    assert.equal(ctx.comments.findById(comment.id)?.status, "replied");
  } finally {
    db.close();
  }
});

test("processCommentReply manual draft bypasses reply_mode off", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "f".repeat(64),
      metaAccessToken: "meta",
    });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post",
      igMediaId: "media-manual-draft",
      publishedAt: new Date().toISOString(),
      replyMode: "off",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-manual-draft-1",
      postId: post.id,
      text: "Pergunta manual",
    });

    let metaCalled = false;
    await processCommentReply(ctx, comment.id, {
      trigger: "manual",
      replyModeOverride: "draft",
      llmCompleter: createHarnessLlmMock({ draftText: "Rascunho manual" }),
      metaCommentReplier: {
        async reply() {
          metaCalled = true;
        },
      },
    });

    assert.equal(metaCalled, false);
    assert.equal(ctx.comments.findLatestDraft(comment.id)?.draftText, "Rascunho manual");
    assert.equal(ctx.comments.findById(comment.id)?.status, "pending");
  } finally {
    db.close();
  }
});

test("processCommentReply manual auto publishes even when global is off", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "g".repeat(64),
      metaAccessToken: "meta",
    });

    ctx.appSettingsStore.upsert({
      timezone: "America/Sao_Paulo",
      replyMode: "off",
      autoReplyEnabled: false,
      replyDelaySeconds: 0,
      autoMonitorEnabled: true,
      autoMonitorIntervalSeconds: 300,
    });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post",
      igMediaId: "media-manual-auto",
      publishedAt: new Date().toISOString(),
      replyMode: "inherit",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-manual-auto-1",
      postId: post.id,
      text: "Oi manual",
    });

    let published = false;
    await processCommentReply(ctx, comment.id, {
      trigger: "manual",
      replyModeOverride: "auto",
      llmCompleter: createHarnessLlmMock({ draftText: "Resposta manual" }),
      metaCommentReplier: {
        async reply() {
          published = true;
          return { publishedIgCommentId: "reply-manual-1" };
        },
      },
    });

    assert.equal(published, true);
    assert.equal(ctx.comments.findById(comment.id)?.status, "replied");
  } finally {
    db.close();
  }
});
