import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import { enqueueMessageReply } from "./enqueue-message-reply.ts";
import { defaultAppSettings } from "../settings/app-settings-defaults.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import { createHarnessLlmMock } from "../../test-utils/harness-llm-mock.ts";

function withMockLlm(ctx: ReturnType<typeof createAppContext>): void {
  const llm = createHarnessLlmMock({ draftText: "ok" });
  (ctx as { resolveLlmCompleter: () => LlmCompleter | null }).resolveLlmCompleter = () => llm;
}

test("enqueueMessageReply schedules pending inbound message when draft mode enabled", () => {
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
      ...defaultAppSettings(),
      messageReplyMode: "draft",
      messageAutoReplyEnabled: true,
      messageReplyDelaySeconds: 0,
    });

    withMockLlm(ctx);

    const { conversation } = ctx.conversations.upsert({
      igConversationId: "ig:123",
      participantIgUserId: "123",
    });

    const { message } = ctx.messages.upsertInbound({
      igMessageId: "m1",
      conversationId: conversation.id,
      text: "oi",
      igTimestamp: new Date().toISOString(),
    });

    const scheduled = enqueueMessageReply(ctx, message.id);
    assert.equal(scheduled, true);

    const pending = ctx.messages.listPendingForAgentReply();
    assert.equal(pending.length, 1);
    assert.equal(pending[0]?.id, message.id);
  } finally {
    db.close();
  }
});

test("listPendingForAgentReply respects conversation inherit reply mode", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const ctx = createAppContext({ db, skipMigrations: true });

    ctx.appSettingsStore.upsert({
      ...defaultAppSettings(),
      messageReplyMode: "off",
      messageAutoReplyEnabled: false,
    });

    const { conversation } = ctx.conversations.upsert({
      igConversationId: "ig:456",
      participantIgUserId: "456",
    });

    const { message } = ctx.messages.upsertInbound({
      igMessageId: "m2",
      conversationId: conversation.id,
      text: "teste",
      igTimestamp: new Date().toISOString(),
    });

    ctx.messages.scheduleAgentReply(message.id, new Date().toISOString());
    assert.equal(ctx.messages.listPendingForAgentReply().length, 0);

    ctx.conversations.updateReplyMode(conversation.id, "draft");
    assert.equal(ctx.messages.listPendingForAgentReply().length, 1);
  } finally {
    db.close();
  }
});
