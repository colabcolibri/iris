import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";
import { createSqliteConversationRepository } from "./conversation-repository.ts";
import { createSqliteMessageRepository } from "./message-repository.ts";

test("message upsert normalizes Meta ig_timestamp for sqlite ordering", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const conversations = createSqliteConversationRepository(db);
    const messages = createSqliteMessageRepository(db);

    const { conversation } = conversations.upsert({
      igConversationId: "ig-conv-1",
      participantIgUserId: "user-1",
      participantUsername: "fan",
      participantDisplayName: null,
      participantAvatarUrl: null,
      lastMessageAt: null,
    });

    messages.upsertOutbound({
      igMessageId: "ig-msg-1",
      conversationId: conversation.id,
      text: "",
      igTimestamp: "2026-07-16T01:25:00+0000",
      status: "replied",
    });
    messages.upsertInbound({
      igMessageId: "ig-msg-2",
      conversationId: conversation.id,
      text: "Ei, tá aí?",
      igTimestamp: "2026-08-14T11:45:00+0000",
    });
    messages.upsertOutbound({
      igMessageId: "ig-msg-3",
      conversationId: conversation.id,
      text: "",
      igTimestamp: "2026-08-02T01:14:00+0000",
      status: "replied",
    });

    const ordered = messages.listByConversationId(conversation.id);
    assert.deepEqual(
      ordered.map((message) => message.igMessageId),
      ["ig-msg-1", "ig-msg-3", "ig-msg-2"],
    );
    assert.equal(ordered[0]?.igTimestamp, "2026-07-16T01:25:00.000Z");
    assert.equal(ordered[2]?.igTimestamp, "2026-08-14T11:45:00.000Z");
  } finally {
    db.close();
  }
});
