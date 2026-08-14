import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteConversationRepository } from "../../adapters/sqlite/conversation-repository.ts";
import { createSqliteMessageRepository } from "../../adapters/sqlite/message-repository.ts";
import { resolveMessageRecipientForSend } from "./resolve-message-recipient.ts";
import type { MetaConversationsReader } from "../../ports/meta-conversations-reader.ts";

function createReaderStub(
  recipientFromMessage: string | null,
): MetaConversationsReader {
  return {
    listConversations: async () => [],
    listMessages: async () => ({ messages: [], after: null }),
    resolveParticipantProfile: async () => null,
    resolveMessagingRecipientFromIgMessage: async () => recipientFromMessage,
  };
}

test("resolveMessageRecipientForSend prefers customer igsid from Meta message lookup", async () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const conversations = createSqliteConversationRepository(db);
    const messages = createSqliteMessageRepository(db);

    const { conversation } = conversations.upsert({
      igConversationId: "ig:wrong-owner",
      participantIgUserId: "ig-owner",
      participantUsername: "marca",
    });

    const { message } = messages.upsertInbound({
      igMessageId: "mid-1",
      conversationId: conversation.id,
      text: "oi",
      igTimestamp: "2026-08-13T11:00:00.000Z",
    });

    const result = await resolveMessageRecipientForSend(
      conversation,
      {
        conversations,
        messages,
        metaConversationsReader: createReaderStub("customer-igsid"),
        ownerIgUserId: "ig-owner",
        ownerUsername: "marca",
      },
      { replyToMessage: message },
    );

    assert.equal(result.recipientId, "customer-igsid");
    const updated = conversations.findById(conversation.id);
    assert.equal(updated?.participantIgUserId, "customer-igsid");
  } finally {
    db.close();
  }
});
