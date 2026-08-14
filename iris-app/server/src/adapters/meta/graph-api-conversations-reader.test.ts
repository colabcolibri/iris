import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createGraphApiConversationsReader,
  MetaConversationsRateLimitError,
  MetaConversationsUnsupportedError,
} from "./graph-api-conversations-reader.ts";

test("graph api conversations reader lists conversation ids with participants", async () => {
  const fetchImpl = async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    assert.match(url.pathname, /\/ig-1\/conversations$/);
    assert.match(url.search, /platform=instagram/);
    assert.match(url.search, /participants/);

    return new Response(
      JSON.stringify({
        data: [
          {
            id: "conv-1",
            updated_time: "2026-08-10T12:00:00+0000",
            participants: {
              data: [
                { id: "ig-1", username: "marca" },
                { id: "user-1", username: "cliente" },
              ],
            },
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

  const conversations = await reader.listConversations(5);
  assert.equal(conversations.length, 1);
  assert.equal(conversations[0]?.id, "conv-1");
  assert.equal(conversations[0]?.participants.length, 2);
  assert.deepEqual(conversations[0]?.recentMessages, []);
});

test("graph api conversations reader requests nested messages in one call", async () => {
  const fetchImpl = async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    assert.match(decodeURIComponent(url.search), /messages\.limit\(20\)/);

    return new Response(
      JSON.stringify({
        data: [
          {
            id: "conv-1",
            updated_time: "2026-08-10T12:00:00+0000",
            participants: {
              data: [
                { id: "ig-1", username: "marca" },
                { id: "user-1", username: "cliente" },
              ],
            },
            messages: {
              data: [
                {
                  id: "mid-1",
                  message: "oi",
                  created_time: "2026-08-13T10:00:00+0000",
                  from: { id: "user-1", username: "cliente", name: "Cliente" },
                },
              ],
            },
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

  const conversations = await reader.listConversations(5, { includeRecentMessages: true });
  assert.equal(conversations[0]?.recentMessages.length, 1);
  assert.equal(conversations[0]?.recentMessages[0]?.direction, "inbound");
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

test("graph api conversations reader maps rate limit errors", async () => {
  const fetchImpl = async () =>
    new Response(
      JSON.stringify({ error: { message: "Application request limit reached", code: 4 } }),
      { status: 403 },
    );

  const reader = createGraphApiConversationsReader({
    metaTokenStore: { getActiveToken: () => "token" },
    config: {
      resolveIgUserId: () => "ig-1",
      fetchImpl: fetchImpl as typeof fetch,
    },
  });

  await assert.rejects(
    () => reader.listConversations(5),
    MetaConversationsRateLimitError,
  );
});

test("graph api conversations reader lists messages with attachments", async () => {
  const fetchImpl = async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    assert.match(url.pathname, /\/conv-1\/messages$/);
    assert.match(url.search, /attachments/);

    return new Response(
      JSON.stringify({
        data: [
          {
            id: "mid-1",
            message: "",
            created_time: "2026-08-13T10:00:00+0000",
            from: { id: "user-1", username: "cliente", name: "Cliente" },
            attachments: {
              data: [
                {
                  image_data: {
                    url: "https://cdn.example/photo.jpg",
                  },
                },
              ],
            },
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
  assert.equal(page.messages[0]?.fromDisplayName, "Cliente");
  assert.equal(page.messages[0]?.attachments[0]?.url, "https://cdn.example/photo.jpg");
  assert.equal(page.messages[1]?.direction, "outbound");
});

test("graph api conversations reader resolves participant profile", async () => {
  const fetchImpl = async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    assert.match(url.pathname, /\/user-1$/);
    return new Response(
      JSON.stringify({
        id: "user-1",
        username: "cliente",
        name: "Cliente",
        profile_pic: "https://cdn.example/avatar.jpg",
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

  const profile = await reader.resolveParticipantProfile("user-1");
  assert.equal(profile?.username, "cliente");
  assert.equal(profile?.profilePicUrl, "https://cdn.example/avatar.jpg");
});

test("graph api conversations reader resolves customer igsid from inbound message", async () => {
  const fetchImpl = async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    assert.match(url.pathname, /\/mid-inbound-1$/);
    assert.match(url.search, /fields=from%2Cto/);

    return new Response(
      JSON.stringify({
        from: { id: "customer-igsid", username: "cliente" },
        to: { data: [{ id: "ig-1", username: "marca" }] },
      }),
      { status: 200 },
    );
  };

  const reader = createGraphApiConversationsReader({
    metaTokenStore: { getActiveToken: () => "token" },
    config: {
      resolveIgUserId: () => "ig-1",
      resolveOwnerUsername: () => "marca",
      fetchImpl: fetchImpl as typeof fetch,
    },
  });

  const recipient = await reader.resolveMessagingRecipientFromIgMessage(
    "mid-inbound-1",
    "ig-1",
    "marca",
  );
  assert.equal(recipient, "customer-igsid");
});
