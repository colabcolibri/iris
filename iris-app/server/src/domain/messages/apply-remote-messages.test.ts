import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteConversationRepository } from "../../adapters/sqlite/conversation-repository.ts";
import { createSqliteMessageRepository } from "../../adapters/sqlite/message-repository.ts";
import { applyRemoteMessages } from "./apply-remote-messages.ts";
import { daysAgoIso } from "../../test-utils/recent-timestamps.ts";

test("applyRemoteMessages keeps the newest message timestamp for inbox ordering", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const conversations = createSqliteConversationRepository(db);
    const messages = createSqliteMessageRepository(db);

    const { conversation } = conversations.upsert({
      igConversationId: "conv-1",
      participantIgUserId: "user-1",
      participantUsername: "sergio",
      participantDisplayName: "Sergio Luciano",
      participantAvatarUrl: null,
      lastMessageAt: daysAgoIso(25),
    });

    const newerOutbound = daysAgoIso(1);
    const olderInbound = daysAgoIso(25);

    const result = applyRemoteMessages(
      conversation.id,
      [
        {
          id: "mid-new",
          text: null,
          fromId: "ig-1",
          fromUsername: "marca",
          fromDisplayName: "Marca",
          createdTime: newerOutbound,
          direction: "outbound",
          attachments: [],
        },
        {
          id: "mid-old",
          text: "oi",
          fromId: "user-1",
          fromUsername: "sergio",
          fromDisplayName: "Sergio Luciano",
          createdTime: olderInbound,
          direction: "inbound",
          attachments: [],
        },
      ],
      { conversations, messages },
    );

    assert.equal(result.imported, 2);

    const updated = conversations.findById(conversation.id);
    assert.ok(updated?.lastMessageAt);
    assert.ok(
      Date.parse(updated!.lastMessageAt!) >= Date.parse(newerOutbound) - 1000,
    );

    const [listed] = conversations.listRecent(10);
    assert.equal(listed?.lastMessageAt, updated?.lastMessageAt);
  } finally {
    db.close();
  }
});
