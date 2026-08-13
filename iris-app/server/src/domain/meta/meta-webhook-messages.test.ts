import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMessageEntries } from "./meta-webhook.ts";

test("parseMessageEntries reads instagram messaging payload", () => {
  const payload = {
    object: "instagram",
    entry: [
      {
        id: "page-1",
        time: 1_569_263_646_000,
        messaging: [
          {
            sender: { id: "user-123" },
            recipient: { id: "page-ig-1" },
            timestamp: 1_569_263_646_000,
            message: {
              mid: "mid.inbound.1",
              text: "quanto custa?",
            },
          },
          {
            sender: { id: "page-ig-1" },
            recipient: { id: "user-123" },
            timestamp: 1_569_263_700_000,
            message: {
              mid: "mid.outbound.1",
              text: "já respondo",
            },
          },
        ],
      },
    ],
  };

  const parsed = parseMessageEntries(payload, { igUserId: "page-ig-1", igUsername: null });
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0]?.direction, "inbound");
  assert.equal(parsed[0]?.igMessageId, "mid.inbound.1");
  assert.equal(parsed[1]?.direction, "outbound");
});

test("parseMessageEntries reads changes field messages", () => {
  const payload = {
    entry: [
      {
        changes: [
          {
            field: "messages",
            value: {
              id: "mid.changes.1",
              from: { id: "user-999" },
              text: "bom dia",
              timestamp: "2026-08-13T12:00:00+0000",
            },
          },
        ],
      },
    ],
  };

  const parsed = parseMessageEntries(payload, { igUserId: "page-ig-1", igUsername: null });
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0]?.igMessageId, "mid.changes.1");
  assert.equal(parsed[0]?.direction, "inbound");
});

test("parseMessageEntries detects outbound via webhook entry.id when oauth user_id differs", () => {
  const payload = {
    object: "instagram",
    entry: [
      {
        id: "page-ig-1",
        messaging: [
          {
            sender: { id: "page-ig-1" },
            recipient: { id: "user-123" },
            timestamp: 1_569_263_700_000,
            message: {
              mid: "mid.outbound.entry-id",
              text: "resposta da marca",
            },
          },
        ],
      },
    ],
  };

  const parsed = parseMessageEntries(payload, {
    igUserId: "oauth-user-id-different",
    igUsername: null,
  });
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0]?.direction, "outbound");
});

test("parseMessageEntries detects outbound via owner username", () => {
  const payload = {
    entry: [
      {
        id: "entry-ignored",
        messaging: [
          {
            sender: { id: "scoped-owner-99", username: "minha_loja" },
            recipient: { id: "user-123" },
            message: { mid: "mid.outbound.username", text: "oi" },
          },
        ],
      },
    ],
  };

  const parsed = parseMessageEntries(payload, {
    igUserId: "oauth-user-id",
    igUsername: "minha_loja",
  });
  assert.equal(parsed[0]?.direction, "outbound");
});
