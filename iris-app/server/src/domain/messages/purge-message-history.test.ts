import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteConversationRepository } from "../../adapters/sqlite/conversation-repository.ts";
import { createSqliteMessageRepository } from "../../adapters/sqlite/message-repository.ts";
import { purgeMessageHistory } from "./purge-message-history.ts";
import { messageImportCutoffIso } from "./message-sync-window.ts";

test("purgeMessageHistory removes messages older than import window", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const conversations = createSqliteConversationRepository(db);
    const messages = createSqliteMessageRepository(db);

    const { conversation } = conversations.upsert({
      igConversationId: "conv-old",
      participantIgUserId: "user-old",
      participantUsername: "antigo",
      lastMessageAt: "2025-01-01T00:00:00.000Z",
    });

    messages.upsertInbound({
      igMessageId: "old-1",
      conversationId: conversation.id,
      text: "mensagem antiga",
      igTimestamp: "2025-01-01T00:00:00.000Z",
    });

    const { conversation: recentConversation } = conversations.upsert({
      igConversationId: "conv-new",
      participantIgUserId: "user-new",
      participantUsername: "recente",
      lastMessageAt: new Date().toISOString(),
    });

    messages.upsertInbound({
      igMessageId: "new-1",
      conversationId: recentConversation.id,
      text: "mensagem recente",
      igTimestamp: new Date().toISOString(),
    });

    const result = purgeMessageHistory({ messages });
    assert.equal(result.messagesDeleted, 1);
    assert.equal(result.conversationsDeleted, 1);
    assert.equal(messages.listByConversationId(conversation.id).length, 0);
    assert.equal(messages.listByConversationId(recentConversation.id).length, 1);
    assert.equal(result.cutoff, messageImportCutoffIso());
  } finally {
    db.close();
  }
});
