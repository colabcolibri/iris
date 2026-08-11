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
    computeAgentReplyNotBefore(now, 90),
    "2026-08-11T12:01:30.000Z",
  );
});

test("normalizeReplyDelaySeconds clamps to allowed range", () => {
  assert.equal(normalizeReplyDelaySeconds(0), 0);
  assert.equal(normalizeReplyDelaySeconds(20), 0);
  assert.equal(normalizeReplyDelaySeconds(90), 90);
  assert.equal(normalizeReplyDelaySeconds(999), 600);
});

test("isValidReplyDelaySeconds accepts 0 and 30-600", () => {
  assert.equal(isValidReplyDelaySeconds(0), true);
  assert.equal(isValidReplyDelaySeconds(29), false);
  assert.equal(isValidReplyDelaySeconds(30), true);
  assert.equal(isValidReplyDelaySeconds(120), true);
  assert.equal(isValidReplyDelaySeconds(601), false);
});
