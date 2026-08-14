import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import { defaultAppSettings } from "../settings/app-settings-defaults.ts";
import { listAgentReplyQueue } from "./list-agent-reply-queue.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import { createHarnessLlmMock } from "../../test-utils/harness-llm-mock.ts";
import { enqueueMessageReply } from "../messages/enqueue-message-reply.ts";
import { enqueueCommentReply } from "../comments/enqueue-comment-reply.ts";

test("listAgentReplyQueue classifies debouncing and due items", () => {
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
      ...defaultAppSettings(),
      messageReplyMode: "draft",
      messageReplyDelaySeconds: 120,
      replyMode: "auto",
      replyDelaySeconds: 120,
    });

    const llm = createHarnessLlmMock({ draftText: "ok" });
    (ctx as { resolveLlmCompleter: () => LlmCompleter | null }).resolveLlmCompleter = () => llm;

    const { conversation } = ctx.conversations.upsert({
      igConversationId: "ig:queue",
      participantIgUserId: "queue-user",
      participantUsername: "ana",
    });

    const dueMessage = ctx.messages.upsertInbound({
      igMessageId: "queue-due",
      conversationId: conversation.id,
      text: "due agora",
      igTimestamp: "2026-08-14T10:00:00.000Z",
    }).message;

    enqueueMessageReply(ctx, dueMessage.id);
    ctx.messages.scheduleAgentReply(
      dueMessage.id,
      new Date("2026-08-14T09:59:00.000Z").toISOString(),
    );

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      igMediaId: "media-queue",
      publishedAt: new Date().toISOString(),
      replyMode: "auto",
    });

    const comment = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-queue-comment",
      postId: post.id,
      authorUsername: "bob",
      text: "quanto custa?",
      igTimestamp: "2026-08-14T10:00:05.000Z",
    }).comment;

    enqueueCommentReply(ctx, comment.id);

    const snapshot = listAgentReplyQueue({
      messages: ctx.messages,
      comments: ctx.comments,
      settings: { ...defaultAppSettings(), messageReplyDelaySeconds: 120, replyDelaySeconds: 120 },
      now: new Date("2026-08-14T10:01:00.000Z"),
    });

    assert.ok(snapshot.items.some((item) => item.channel === "dm" && item.phase === "due"));
    assert.ok(
      snapshot.items.some((item) => item.channel === "comment" && item.phase === "debouncing"),
    );
    assert.equal(snapshot.counts.total, snapshot.items.length);
  } finally {
    db.close();
  }
});

test("listAgentReplyQueue keeps one active dm per conversation", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "b".repeat(64),
      metaAccessToken: "meta",
    });

    const llm = createHarnessLlmMock({ draftText: "ok" });
    (ctx as { resolveLlmCompleter: () => LlmCompleter | null }).resolveLlmCompleter = () => llm;

    ctx.appSettingsStore.upsert({
      ...defaultAppSettings(),
      messageReplyMode: "draft",
    });

    const { conversation } = ctx.conversations.upsert({
      igConversationId: "ig:burst-queue",
      participantIgUserId: "burst",
      participantUsername: "ana",
    });

    const first = ctx.messages.upsertInbound({
      igMessageId: "burst-1",
      conversationId: conversation.id,
      text: "oi",
      igTimestamp: "2026-08-14T10:00:00.000Z",
    }).message;
    const second = ctx.messages.upsertInbound({
      igMessageId: "burst-2",
      conversationId: conversation.id,
      text: "quero comprar",
      igTimestamp: "2026-08-14T10:00:10.000Z",
    }).message;

    enqueueMessageReply(ctx, first.id);
    enqueueMessageReply(ctx, second.id);
    ctx.messages.scheduleAgentReply(first.id, new Date(Date.now() + 120_000).toISOString());
    ctx.messages.scheduleAgentReply(second.id, new Date(Date.now() + 120_000).toISOString());

    const snapshot = listAgentReplyQueue({
      messages: ctx.messages,
      comments: ctx.comments,
      settings: defaultAppSettings(),
    });

    const dmItems = snapshot.items.filter((item) => item.channel === "dm");
    assert.equal(dmItems.length, 1);
    assert.equal(dmItems[0]?.messageId, second.id);
  } finally {
    db.close();
  }
});
