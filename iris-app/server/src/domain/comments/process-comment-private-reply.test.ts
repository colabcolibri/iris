import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import { enqueueCommentPrivateReply } from "./enqueue-comment-private-reply.ts";
import { processCommentPrivateReply } from "./process-comment-private-reply.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import { createTestLlmCompletion } from "../../ports/llm-completer.ts";
import { createHarnessLlmMock } from "../../test-utils/harness-llm-mock.ts";

function withMockLlm(ctx: ReturnType<typeof createAppContext>): void {
  const llm = createHarnessLlmMock({ draftText: "ok" });
  (ctx as { resolveLlmCompleter: () => LlmCompleter | null }).resolveLlmCompleter = () => llm;
}

test("processCommentPrivateReply sends DM when private_reply_mode is auto", async () => {
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
      caption: "Promo",
      igMediaId: "media-priv",
      publishedAt: new Date().toISOString(),
      replyMode: "off",
      privateReplyMode: "auto",
      agentActiveDays: 7,
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-private-1",
      postId: post.id,
      authorUsername: "fan",
      text: "QUERO",
      igTimestamp: new Date().toISOString(),
    });

    withMockLlm(ctx);

    assert.equal(enqueueCommentPrivateReply(ctx, comment.id), true);

    let privateReplyText: string | null = null;
    const ok = await processCommentPrivateReply(ctx, comment.id, {
      trigger: "worker",
      llmCompleter: {
        async complete(_prompt) {
          privateReplyText = "Aqui está seu cupom!";
          return createTestLlmCompletion(privateReplyText);
        },
      },
      metaMessageSender: {
        async sendText() {
          throw new Error("should not send DM by user id");
        },
        async sendPrivateReplyToComment(_igCommentId, text) {
          assert.equal(text, "Aqui está seu cupom!");
          return { publishedIgMessageId: "mid-priv-1", recipientIgUserId: "user-9" };
        },
      },
    });

    assert.equal(ok, true);
    assert.equal(ctx.comments.hasPrivateReplyRecord(comment.id), true);
    const sent = ctx.comments.findLatestSentReply(comment.id, "private");
    assert.equal(sent?.sentText, "Aqui está seu cupom!");
  } finally {
    db.close();
  }
});

test("enqueueCommentPrivateReply skips when agent_active campaign expired", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "e".repeat(64),
      metaAccessToken: "meta",
    });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      publishedAt: "2026-01-01T12:00:00.000Z",
      replyMode: "off",
      privateReplyMode: "auto",
      agentActiveDays: 7,
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-expired-1",
      postId: post.id,
      text: "tarde",
      igTimestamp: new Date().toISOString(),
    });

    withMockLlm(ctx);

    assert.equal(enqueueCommentPrivateReply(ctx, comment.id), false);
  } finally {
    db.close();
  }
});
