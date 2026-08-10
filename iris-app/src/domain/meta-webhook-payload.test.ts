import { test } from "node:test";
import assert from "node:assert/strict";

test("truncateWebhookPayload keeps short payloads intact", async () => {
  const { truncateWebhookPayload } = await import("./meta-webhook-payload.ts");
  const payload = '{"entry":[{"id":"1"}]}';
  assert.equal(truncateWebhookPayload(payload), payload);
});

test("truncateWebhookPayload caps oversized payloads", async () => {
  const { truncateWebhookPayload, WEBHOOK_PAYLOAD_MAX_BYTES } = await import(
    "./meta-webhook-payload.ts"
  );
  const payload = "x".repeat(WEBHOOK_PAYLOAD_MAX_BYTES + 100);
  const truncated = truncateWebhookPayload(payload);

  assert.ok(truncated.endsWith("…"));
  assert.equal(truncated.length, WEBHOOK_PAYLOAD_MAX_BYTES + 1);
});
