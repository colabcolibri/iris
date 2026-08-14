import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteMessageRepository } from "../../adapters/sqlite/message-repository.ts";
import { createSqliteConversationRepository } from "../../adapters/sqlite/conversation-repository.ts";
import { AGENT_REPLY_EDIT_SKIP_REASON } from "../../domain/agent-reply/agent-reply-debounce.ts";
import { enqueueMessageReply } from "../../domain/messages/enqueue-message-reply.ts";
import { createAppContext } from "../../api/app-context.ts";
import { defaultAppSettings } from "../../domain/settings/app-settings-defaults.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import { createHarnessLlmMock } from "../../test-utils/harness-llm-mock.ts";

test("upsertInbound cancels scheduled auto-reply when message text is edited", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const conversations = createSqliteConversationRepository(db);
    const messages = createSqliteMessageRepository(db);

    const { conversation } = conversations.upsert({
      igConversationId: "ig:edit",
      participantIgUserId: "edit",
    });

    const created = messages.upsertInbound({
      igMessageId: "m-edit",
      conversationId: conversation.id,
      text: "oi",
      igTimestamp: "2026-08-14T10:00:00.000Z",
    });

    messages.scheduleAgentReply(created.message.id, "2026-08-14T10:01:00.000Z");

    messages.upsertInbound({
      igMessageId: "m-edit",
      conversationId: conversation.id,
      text: "oi, editado",
      igTimestamp: "2026-08-14T10:00:00.000Z",
    });

    const updated = messages.findById(created.message.id);
    assert.equal(updated?.status, "skipped");
    assert.equal(updated?.errorMessage, AGENT_REPLY_EDIT_SKIP_REASON);
    assert.equal(updated?.agentReplyNotBefore, null);
  } finally {
    db.close();
  }
});

test("enqueueMessageReply sliding debounce resets timer on newer inbound", async () => {
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
      ...defaultAppSettings(),
      messageReplyMode: "draft",
      messageReplyDelaySeconds: 60,
    });

    const llm = createHarnessLlmMock({ draftText: "ok" });
    (ctx as { resolveLlmCompleter: () => LlmCompleter | null }).resolveLlmCompleter = () => llm;

    const { conversation } = ctx.conversations.upsert({
      igConversationId: "ig:slide",
      participantIgUserId: "slide",
    });

    const first = ctx.messages.upsertInbound({
      igMessageId: "slide-1",
      conversationId: conversation.id,
      text: "um",
      igTimestamp: "2026-08-14T10:00:00.000Z",
    }).message;

    enqueueMessageReply(ctx, first.id);
    const firstNotBefore = ctx.messages.findById(first.id)?.agentReplyNotBefore;
    assert.ok(firstNotBefore);

    await new Promise((resolve) => setTimeout(resolve, 5));

    const second = ctx.messages.upsertInbound({
      igMessageId: "slide-2",
      conversationId: conversation.id,
      text: "dois",
      igTimestamp: "2026-08-14T10:00:05.000Z",
    }).message;

    enqueueMessageReply(ctx, second.id);
    const secondNotBefore = ctx.messages.findById(second.id)?.agentReplyNotBefore;
    assert.ok(secondNotBefore);
    assert.ok(secondNotBefore! >= firstNotBefore!);
    assert.equal(ctx.messages.findById(first.id)?.status, "skipped");
  } finally {
    db.close();
  }
});
