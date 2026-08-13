import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteConversationRepository } from "../../adapters/sqlite/conversation-repository.ts";
import { createSqliteMessageRepository } from "../../adapters/sqlite/message-repository.ts";
import { reconcileConversationPendingStatuses } from "./reconcile-conversation-pending-statuses.ts";

test("reconcileConversationPendingStatuses marks older inbound as replied after outbound", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const conversations = createSqliteConversationRepository(db);
    const messages = createSqliteMessageRepository(db);

    const { conversation } = conversations.upsert({
      igConversationId: "conv-1",
      participantIgUserId: "user-1",
      participantUsername: "cliente",
      lastMessageAt: "2026-08-13T12:00:00.000Z",
    });

    messages.upsertInbound({
      igMessageId: "in-1",
      conversationId: conversation.id,
      text: "oi",
      igTimestamp: "2026-08-13T10:00:00.000Z",
    });
    messages.upsertOutbound({
      igMessageId: "out-1",
      conversationId: conversation.id,
      text: "olá",
      igTimestamp: "2026-08-13T10:05:00.000Z",
      status: "replied",
    });
    messages.upsertInbound({
      igMessageId: "in-2",
      conversationId: conversation.id,
      text: "e agora?",
      igTimestamp: "2026-08-13T11:00:00.000Z",
    });

    reconcileConversationPendingStatuses(conversation.id, messages);

    const thread = messages.listByConversationId(conversation.id);
    assert.equal(thread[0]?.status, "replied");
    assert.equal(thread[2]?.status, "pending");
    assert.equal(messages.countPendingByConversation(conversation.id), 1);
  } finally {
    db.close();
  }
});
