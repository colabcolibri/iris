import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  parseCommentEntries,
  verifyHubSignature,
  verifySubscribeToken,
} from "./meta-webhook.ts";

test("verifySubscribeToken matches expected token", () => {
  assert.equal(verifySubscribeToken("secret-token", "secret-token"), true);
  assert.equal(verifySubscribeToken("wrong", "secret-token"), false);
});

test("verifyHubSignature validates sha256 header", () => {
  const body = Buffer.from('{"object":"instagram"}');
  const secret = "app-secret";
  const digest = createHmac("sha256", secret).update(body).digest("hex");

  assert.equal(
    verifyHubSignature(body, `sha256=${digest}`, secret),
    true,
  );
  assert.equal(verifyHubSignature(body, "sha256=invalid", secret), false);
});

test("parseCommentEntries extracts instagram comment payload", () => {
  const entries = parseCommentEntries({
    object: "instagram",
    entry: [
      {
        changes: [
          {
            field: "comments",
            value: {
              id: "comment-1",
              text: "ótimo post",
              from: { username: "fan_user" },
              media: { id: "media-99" },
            },
          },
        ],
      },
    ],
  });

  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0], {
    igCommentId: "comment-1",
    igMediaId: "media-99",
    parentIgCommentId: null,
    text: "ótimo post",
    authorUsername: "fan_user",
  });
});
