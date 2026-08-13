import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeAgentReplyNotBefore,
  isValidReplyDelaySeconds,
  normalizeReplyDelaySeconds,
} from "./compute-agent-reply-not-before.ts";

test("computeAgentReplyNotBefore returns now when delay is 0", () => {
  const now = new Date("2026-08-11T12:00:00.000Z");
  assert.equal(computeAgentReplyNotBefore(now, 0), now.toISOString());
});

test("computeAgentReplyNotBefore adds delay seconds", () => {
  const now = new Date("2026-08-11T12:00:00.000Z");
  assert.equal(
    computeAgentReplyNotBefore(now, 120),
    "2026-08-11T12:02:00.000Z",
  );
});

test("normalizeReplyDelaySeconds clamps to allowed range", () => {
  assert.equal(normalizeReplyDelaySeconds(0), 0);
  assert.equal(normalizeReplyDelaySeconds(30), 0);
  assert.equal(normalizeReplyDelaySeconds(120), 120);
  assert.equal(normalizeReplyDelaySeconds(9999), 3600);
});

test("isValidReplyDelaySeconds accepts 0 and 60-3600", () => {
  assert.equal(isValidReplyDelaySeconds(0), true);
  assert.equal(isValidReplyDelaySeconds(59), false);
  assert.equal(isValidReplyDelaySeconds(60), true);
  assert.equal(isValidReplyDelaySeconds(120), true);
  assert.equal(isValidReplyDelaySeconds(3601), false);
});
