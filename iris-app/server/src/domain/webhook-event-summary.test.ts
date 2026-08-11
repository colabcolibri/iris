import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatWebhookType,
  summarizeWebhookPayload,
} from "./webhook-event-summary.ts";

test("formatWebhookType builds readable label", () => {
  assert.equal(formatWebhookType("instagram", "comments"), "Instagram · Comentário");
});

test("summarizeWebhookPayload extracts comment metadata", () => {
  const payload = JSON.stringify({
    object: "instagram",
    entry: [
      {
        changes: [
          {
            field: "comments",
            value: {
              id: "ig-comment-99",
              verb: "add",
              text: "Quero saber mais",
              from: { username: "carlosacm01" },
              media: { id: "media-123" },
            },
          },
        ],
      },
    ],
  });

  const summary = summarizeWebhookPayload(payload, "instagram", "comments");
  assert.equal(summary.webhook_type, "Instagram · Comentário");
  assert.equal(summary.verb, "add");
  assert.equal(summary.ig_comment_id, "ig-comment-99");
  assert.equal(summary.ig_media_id, "media-123");
  assert.equal(summary.author_username, "carlosacm01");
  assert.match(summary.text_preview ?? "", /Quero saber mais/);
});
