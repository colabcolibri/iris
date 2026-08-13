import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import { listMessageActivity } from "./list-message-activity.ts";

test("listMessageActivity returns pending approval drafts", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const ctx = createAppContext({ db, skipMigrations: true });

    const { conversation } = ctx.conversations.upsert({
      igConversationId: "ig:act-1",
      participantIgUserId: "act-1",
      participantUsername: "fan",
    });

    const { message } = ctx.messages.upsertInbound({
      igMessageId: "ig-msg-1",
      conversationId: conversation.id,
      text: "quanto custa?",
      igTimestamp: new Date().toISOString(),
    });

    ctx.messageReplies.upsertDraft({
      messageId: message.id,
      draftText: "Olá! Posso te ajudar.",
    });

    const items = listMessageActivity({
      kind: "pending_approval",
      listActivityRows: (kind, limit) =>
        ctx.messageReplies.listActivityRows(kind, limit),
    });

    assert.equal(items.length, 1);
    assert.equal(items[0]?.messageId, message.id);
    assert.equal(items[0]?.draftTextPreview?.includes("Olá"), true);
  } finally {
    db.close();
  }
});
