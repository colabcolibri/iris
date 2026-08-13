import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";
import { createSqliteConversationRepository } from "./conversation-repository.ts";
import {
  createSqliteMessageRepository,
  createSqliteMessageReplyRepository,
} from "./message-repository.ts";

test("message repositories upsert inbound, draft dedupe and schedule queue", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const conversations = createSqliteConversationRepository(db);
    const messages = createSqliteMessageRepository(db);
    const replies = createSqliteMessageReplyRepository(db);

    const { conversation } = conversations.upsert({
      igConversationId: "ig:participant-1",
      participantIgUserId: "participant-1",
    });

    const first = messages.upsertInbound({
      igMessageId: "mid-1",
      conversationId: conversation.id,
      text: "oi",
      igTimestamp: "2026-08-13T10:00:00.000Z",
    });
    assert.equal(first.created, true);
    assert.equal(first.message.status, "pending");

    const duplicate = messages.upsertInbound({
      igMessageId: "mid-1",
      conversationId: conversation.id,
      text: "oi",
      igTimestamp: "2026-08-13T10:00:00.000Z",
    });
    assert.equal(duplicate.created, false);

    const scheduled = messages.scheduleAgentReply(
      first.message.id,
      "2026-08-13T10:05:00.000Z",
    );
    assert.equal(scheduled, true);

    const draft = replies.upsertDraft({
      messageId: first.message.id,
      draftText: "olá!",
    });
    const draftAgain = replies.upsertDraft({
      messageId: first.message.id,
      draftText: "olá, tudo bem?",
    });
    assert.equal(draft.id, draftAgain.id);
    assert.equal(draftAgain.draftText, "olá, tudo bem?");

    assert.equal(replies.clearDraft(first.message.id), true);
    assert.equal(replies.findLatestDraft(first.message.id), null);

    const thread = messages.listByConversationId(conversation.id);
    assert.equal(thread.length, 1);
    assert.equal(messages.countPendingByConversation(conversation.id), 1);
  } finally {
    db.close();
  }
});
