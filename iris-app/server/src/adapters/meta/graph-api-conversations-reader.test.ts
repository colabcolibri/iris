import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createGraphApiConversationsReader,
  MetaConversationsUnsupportedError,
} from "./graph-api-conversations-reader.ts";

test("graph api conversations reader lists conversation ids", async () => {
  const fetchImpl = async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    assert.match(url.pathname, /\/ig-1\/conversations$/);
    assert.match(url.search, /platform=instagram/);

    return new Response(
      JSON.stringify({
        data: [{ id: "conv-1", updated_time: "2026-08-10T12:00:00+0000" }],
      }),
      { status: 200 },
    );
  };

  const reader = createGraphApiConversationsReader({
    metaTokenStore: { getActiveToken: () => "token" },
    config: {
      resolveIgUserId: () => "ig-1",
      fetchImpl: fetchImpl as typeof fetch,
    },
  });

  const conversations = await reader.listConversations(5);
  assert.equal(conversations.length, 1);
  assert.equal(conversations[0]?.id, "conv-1");
});

test("graph api conversations reader maps permission errors to unsupported", async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify({ error: { message: "denied", code: 10 } }), {
      status: 403,
    });

  const reader = createGraphApiConversationsReader({
    metaTokenStore: { getActiveToken: () => "token" },
    config: {
      resolveIgUserId: () => "ig-1",
      fetchImpl: fetchImpl as typeof fetch,
    },
  });

  await assert.rejects(
    () => reader.listConversations(5),
    MetaConversationsUnsupportedError,
  );
});

test("graph api conversations reader lists messages in a conversation", async () => {
  const fetchImpl = async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    assert.match(url.pathname, /\/conv-1\/messages$/);

    return new Response(
      JSON.stringify({
        data: [
          {
            id: "mid-1",
            message: "oi",
            created_time: "2026-08-13T10:00:00+0000",
            from: { id: "user-1", username: "cliente" },
          },
          {
            id: "mid-2",
            message: "olá",
            created_time: "2026-08-13T10:01:00+0000",
            from: { id: "ig-1", username: "marca" },
          },
        ],
      }),
      { status: 200 },
    );
  };

  const reader = createGraphApiConversationsReader({
    metaTokenStore: { getActiveToken: () => "token" },
    config: {
      resolveIgUserId: () => "ig-1",
      fetchImpl: fetchImpl as typeof fetch,
    },
  });

  const page = await reader.listMessages("conv-1", 10);
  assert.equal(page.messages.length, 2);
  assert.equal(page.messages[0]?.direction, "inbound");
  assert.equal(page.messages[1]?.direction, "outbound");
});
