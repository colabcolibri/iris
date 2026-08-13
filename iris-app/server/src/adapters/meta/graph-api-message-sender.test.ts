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
        return new Response(JSON.stringify({ message_id: "mid-sent-1" }), {
          status: 200,
        });
      },
    },
  });

  const result = await sender.sendText("user-42", "olá!");
  assert.equal(result.publishedIgMessageId, "mid-sent-1");
  assert.match(capturedUrl, /\/ig-page-1\/messages/);
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
