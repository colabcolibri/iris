import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteConversationRepository } from "../../adapters/sqlite/conversation-repository.ts";
import { createSqliteMessageRepository } from "../../adapters/sqlite/message-repository.ts";
import { ingestWebhookMessage } from "./ingest-webhook-message.ts";

test("ingestWebhookMessage creates conversation and inbound message", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const conversations = createSqliteConversationRepository(db);
    const messages = createSqliteMessageRepository(db);

    const result = ingestWebhookMessage(
      {
        igMessageId: "mid-abc",
        senderIgUserId: "user-1",
        recipientIgUserId: "page-1",
        senderUsername: "cliente",
        senderDisplayName: "Cliente",
        text: "tem vaga?",
        igTimestamp: "2026-08-13T11:00:00.000Z",
        direction: "inbound",
        attachmentUrl: null,
        attachmentMediaType: null,
      },
      { conversations, messages, pageIgUserId: "page-1" },
    );

    assert.equal(result.created, true);
    assert.equal(result.skipped, false);
    const thread = messages.listByConversationId(result.conversationId);
    assert.equal(thread.length, 1);
    assert.equal(thread[0]?.text, "tem vaga?");
    const conversation = conversations.findById(result.conversationId);
    assert.equal(conversation?.participantUsername, "cliente");
  } finally {
    db.close();
  }
});
