import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canReplyToConversationMessages,
  canReplyWithinMessagingWindow,
  MESSAGING_WINDOW_MS,
} from "./meta-rules.ts";
import type { Message } from "./message.ts";

function inboundMessage(iso: string): Message {
  return {
    id: "m1",
    igMessageId: "ig1",
    conversationId: "c1",
    direction: "inbound",
    text: "oi",
    igTimestamp: iso,
    status: "pending",
    errorMessage: null,
    agentReplyNotBefore: null,
    createdAt: iso,
  };
}

test("canReplyWithinMessagingWindow accepts recent inbound", () => {
  const now = Date.parse("2026-08-12T12:00:00.000Z");
  const recent = new Date(now - 60_000).toISOString();
  assert.equal(canReplyWithinMessagingWindow(recent, now), true);
});

test("canReplyWithinMessagingWindow rejects expired inbound", () => {
  const now = Date.parse("2026-08-12T12:00:00.000Z");
  const expired = new Date(now - MESSAGING_WINDOW_MS - 1).toISOString();
  assert.equal(canReplyWithinMessagingWindow(expired, now), false);
});

test("canReplyToConversationMessages uses last inbound only", () => {
  const now = Date.now();
  const recent = new Date(now - 60_000).toISOString();
  const expired = new Date(now - MESSAGING_WINDOW_MS - 1).toISOString();

  assert.equal(
    canReplyToConversationMessages([
      inboundMessage(expired),
      inboundMessage(recent),
    ]),
    true,
  );
});
