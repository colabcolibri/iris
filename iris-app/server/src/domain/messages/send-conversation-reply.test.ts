import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteConversationRepository } from "../../adapters/sqlite/conversation-repository.ts";
import { createSqliteMessageRepository } from "../../adapters/sqlite/message-repository.ts";
import { sendConversationReply } from "./send-conversation-reply.ts";

test("sendConversationReply persists outbound with reply_to and does not mark inbound replied", async () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const conversations = createSqliteConversationRepository(db);
    const messages = createSqliteMessageRepository(db);

    const { conversation } = conversations.upsert({
      igConversationId: "conv-1",
      participantIgUserId: "user-1",
      participantUsername: "cliente",
      participantDisplayName: null,
      participantAvatarUrl: null,
      lastMessageAt: "2026-08-14T12:00:00.000Z",
    });

    const inbound = messages.upsertInbound({
      igMessageId: "mid-in-1",
      conversationId: conversation.id,
      text: "pergunta antiga",
      igTimestamp: "2026-08-14T12:00:00.000Z",
    }).message;

    let capturedReplyTo: string | null | undefined;
    const outbound = await sendConversationReply(
      {
        conversationId: conversation.id,
        text: "resposta citada",
        replyToMessageId: inbound.id,
      },
      {
        conversations,
        messages,
        ownerIgUserId: "ig-page",
        ownerUsername: "marca",
        metaConversationsReader: {
          async listConversations() {
            return [];
          },
          async listMessages() {
            return { messages: [], after: null };
          },
          async resolveMessagingRecipientFromIgMessage() {
            return "user-1";
          },
        },
        metaMessageSender: {
          async sendText(_recipient, _text, options) {
            capturedReplyTo = options?.replyToMid;
            return { publishedIgMessageId: "mid-out-1" };
          },
          async sendPrivateReplyToComment() {
            throw new Error("not used in this test");
          },
        },
      },
    );

    assert.equal(capturedReplyTo, "mid-in-1");
    assert.equal(outbound.direction, "outbound");
    assert.equal(outbound.replyToIgMessageId, "mid-in-1");
    assert.equal(inbound.status, "pending");

    const stillPending = messages.findById(inbound.id);
    assert.equal(stillPending?.status, "pending");
  } finally {
    db.close();
  }
});
