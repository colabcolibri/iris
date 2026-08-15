import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../adapters/sqlite/connection.ts";
import { runMigrations } from "../adapters/sqlite/migrate.ts";
import { createAppContext } from "../api/app-context.ts";
import { startCommentResponder } from "./comment-responder.ts";
import { createHarnessLlmMock } from "../test-utils/harness-llm-mock.ts";
import { createTestLlmCompletion } from "../ports/llm-completer.ts";
import type { LlmCompleter } from "../ports/llm-completer.ts";

function withMockLlm(ctx: ReturnType<typeof createAppContext>): LlmCompleter {
  const llm = createHarnessLlmMock({ draftText: "Obrigado pelo interesse!" });
  (ctx as { resolveLlmCompleter: () => LlmCompleter | null }).resolveLlmCompleter = () => llm;
  return llm;
}

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
      publicBaseUrl: "https://iris.example",
      publishUrlSecret: "publish-secret",
    });

    const post = ctx.posts.create({ channel: "instagram", caption: "Post caption" });
    ctx.posts.update(post.id, { replyMode: "auto" });

    ctx.replyPersonaStore.upsert({
      brandName: "Iris",
      signatureInstruction: "",
      responseLanguage: "pt-BR",
      maxChars: 280,
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-c-1",
      postId: post.id,
      text: "Quanto custa?",
      authorUsername: "lead",
    });
    ctx.comments.scheduleAgentReply(comment.id, new Date(Date.now() - 1000).toISOString());

    const replies: string[] = [];
    const prompts: string[] = [];

    ctx.metaCommentReplier = {
      async reply(_igCommentId, message) {
        replies.push(message);
        return {};
      },
    };

    const harnessLlm = createHarnessLlmMock({ draftText: "Obrigado pelo interesse!" });

    const stop = startCommentResponder(ctx, {
      intervalMs: 50,
      llmCompleter: {
        async complete(prompt) {
          prompts.push(prompt);
          return harnessLlm.complete(prompt);
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 120));
    stop();

    const updated = ctx.comments.findById(comment.id);
    assert.equal(updated?.status, "replied");
    assert.equal(replies.length, 1);
    assert.match(prompts[0] ?? "", /Brand restrictions/);
    assert.match(prompts[0] ?? "", /Response language \(MANDATORY\)/);
    assert.match(prompts[1] ?? "", /## SOUL/);

    const run = db
      .prepare("SELECT input_summary FROM agent_runs ORDER BY id DESC LIMIT 1")
      .get() as { input_summary: string };
    const summary = JSON.parse(run.input_summary) as {
      post_id: string;
      thread_length: number;
      asset_count: number;
    };
    assert.equal(summary.post_id, post.id);
    assert.equal(typeof summary.thread_length, "number");
    assert.doesNotMatch(run.input_summary, /Quanto custa/);
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

    const post = ctx.posts.create({ channel: "instagram", replyMode: "off" });
    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-c-2",
      postId: post.id,
      text: "oi",
    });

    let called = false;
    ctx.metaCommentReplier = {
      async reply() {
        called = true;
        return {};
      },
    };
    const stop = startCommentResponder(ctx, {
      intervalMs: 50,
      llmCompleter: {
        async complete() {
          return createTestLlmCompletion("ok");
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 120));
    stop();

    assert.equal(called, false);
    assert.equal(ctx.comments.findById(comment.id)?.status, "pending");
  } finally {
    db.close();
  }
});

test("comment responder skips comments before agent_reply_not_before", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      agentToken: "agent",
      encryptionKey: "g".repeat(64),
      metaAccessToken: "meta",
    });

    const post = ctx.posts.create({ channel: "instagram", replyMode: "auto" });
    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-delay-worker",
      postId: post.id,
      text: "Quando?",
    });

    const future = new Date(Date.now() + 120_000).toISOString();
    ctx.comments.scheduleAgentReply(comment.id, future);

    let called = false;
    const stop = startCommentResponder(ctx, {
      intervalMs: 50,
      llmCompleter: createHarnessLlmMock({ draftText: "Em breve" }),
      metaCommentReplier: {
        async reply() {
          called = true;
          return {};
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 120));
    stop();

    assert.equal(called, false);

    db.prepare(`UPDATE comments SET agent_reply_not_before = ? WHERE id = ?`).run(
      new Date(Date.now() - 1000).toISOString(),
      comment.id,
    );

    const stopAgain = startCommentResponder(ctx, {
      intervalMs: 50,
      llmCompleter: createHarnessLlmMock({ draftText: "Agora sim" }),
      metaCommentReplier: {
        async reply() {
          called = true;
          return {};
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 120));
    stopAgain();

    assert.equal(called, true);
  } finally {
    db.close();
  }
});

test("comment responder processes due comments without resetting debounce when LLM is on context", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      agentToken: "agent",
      encryptionKey: "i".repeat(64),
      metaAccessToken: "meta",
      publicBaseUrl: "https://iris.example",
      publishUrlSecret: "publish-secret",
    });

    ctx.appSettingsStore.upsert({
      timezone: "America/Sao_Paulo",
      replyMode: "auto",
      autoReplyEnabled: true,
      replyDelaySeconds: 180,
      agentReplyTickIntervalSeconds: 180,
      autoMonitorEnabled: true,
      autoMonitorIntervalSeconds: 300,
    });

    const llm = withMockLlm(ctx);

    const post = ctx.posts.create({ channel: "instagram", replyMode: "auto" });
    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-due-with-llm",
      postId: post.id,
      text: "Quanto custa?",
      authorUsername: "lead",
    });

    db.prepare(`UPDATE comments SET agent_reply_not_before = ? WHERE id = ?`).run(
      new Date(Date.now() - 1000).toISOString(),
      comment.id,
    );

    let called = false;
    ctx.metaCommentReplier = {
      async reply() {
        called = true;
        return {};
      },
    };

    const stop = startCommentResponder(ctx, {
      intervalMs: 50,
      llmCompleter: llm,
      metaCommentReplier: ctx.metaCommentReplier,
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    stop();

    assert.equal(called, true);
    assert.equal(ctx.comments.findById(comment.id)?.status, "replied");
  } finally {
    db.close();
  }
});

test("comment responder ignores pending comments not scheduled by webhook", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      agentToken: "agent",
      encryptionKey: "h".repeat(64),
      metaAccessToken: "meta",
    });

    const post = ctx.posts.create({ channel: "instagram", replyMode: "auto" });
    ctx.comments.upsertFromWebhook({
      igCommentId: "ig-sync-only",
      postId: post.id,
      text: "importado via sync",
      authorUsername: "fan",
    });

    let called = false;
    const stop = startCommentResponder(ctx, {
      intervalMs: 50,
      llmCompleter: createHarnessLlmMock({ draftText: "não deveria rodar" }),
      metaCommentReplier: {
        async reply() {
          called = true;
          return {};
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 120));
    stop();

    assert.equal(called, false);
    assert.equal(ctx.comments.listPendingForAgentReply().length, 0);
  } finally {
    db.close();
  }
});
