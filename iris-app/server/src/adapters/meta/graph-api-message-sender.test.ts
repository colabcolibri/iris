import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraphApiMessageSender } from "./graph-api-message-sender.ts";
import { MetaMessageWindowExpiredError } from "../../ports/meta-message-sender.ts";

test("graph api message sender posts recipient payload", async () => {
  let capturedUrl = "";
  let capturedBody = "";

  const sender = createGraphApiMessageSender({
    metaTokenStore: {
      getActiveToken: () => "token-1",
      upsertToken: () => {},
      clear: () => {},
    },
    config: {
      resolveIgUserId: () => "ig-page-1",
      fetchImpl: async (url, init) => {
        capturedUrl = String(url);
        capturedBody = String(init?.body ?? "");
        const headers = new Headers(init?.headers);
        assert.equal(headers.get("Authorization"), "Bearer token-1");
        return new Response(JSON.stringify({ message_id: "mid-sent-1" }), {
          status: 200,
        });
      },
    },
  });

  const result = await sender.sendText("user-42", "olá!");
  assert.equal(result.publishedIgMessageId, "mid-sent-1");
  assert.match(capturedUrl, /\/me\/messages$/);
  assert.doesNotMatch(capturedUrl, /access_token=/);
  assert.match(capturedBody, /user-42/);
});

test("graph api message sender maps 24h window error", async () => {
  const sender = createGraphApiMessageSender({
    metaTokenStore: {
      getActiveToken: () => "token-1",
      upsertToken: () => {},
      clear: () => {},
    },
    config: {
      resolveIgUserId: () => "ig-page-1",
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            error: {
              message: "outside of allowed window",
              code: 10,
              error_subcode: 2534022,
            },
          }),
          { status: 400 },
        ),
    },
  });

  await assert.rejects(
    () => sender.sendText("user-42", "tarde demais"),
    MetaMessageWindowExpiredError,
  );
});

test("graph api message sender takes thread control before send", async () => {
  const calls: string[] = [];

  const sender = createGraphApiMessageSender({
    metaTokenStore: {
      getActiveToken: () => "token-1",
      upsertToken: () => {},
      clear: () => {},
    },
    config: {
      resolveIgUserId: () => "ig-page-1",
      fetchImpl: async (url) => {
        calls.push(String(url));
        return new Response(JSON.stringify({ message_id: "mid-sent-1" }), {
          status: 200,
        });
      },
    },
  });

  await sender.sendText("user-42", "olá!");
  assert.ok(calls.some((url) => url.includes("/me/take_thread_control")));
  assert.ok(calls.some((url) => url.includes("/me/messages")));
});

test("graph api message sender retries after thread owner error", async () => {
  const calls: string[] = [];

  const sender = createGraphApiMessageSender({
    metaTokenStore: {
      getActiveToken: () => "token-1",
      upsertToken: () => {},
      clear: () => {},
    },
    config: {
      resolveIgUserId: () => "ig-page-1",
      fetchImpl: async (url) => {
        calls.push(String(url));
        if (String(url).includes("take_thread_control")) {
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        if (calls.filter((item) => item.includes("/messages")).length === 1) {
          return new Response(
            JSON.stringify({
              error: {
                message: "The action is invalid since it's not the thread owner.",
                code: 100,
                error_subcode: 2534037,
              },
            }),
            { status: 400 },
          );
        }
        return new Response(JSON.stringify({ message_id: "mid-sent-2" }), {
          status: 200,
        });
      },
    },
  });

  const result = await sender.sendText("user-42", "tentativa");
  assert.equal(result.publishedIgMessageId, "mid-sent-2");
  assert.ok(calls.some((url) => url.includes("take_thread_control")));
  assert.equal(calls.filter((url) => url.includes("/me/messages")).length, 2);
});
