import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeAgentReplyNotBefore,
  isValidReplyDelaySeconds,
  normalizeReplyDelaySeconds,
} from "./compute-agent-reply-not-before.ts";

test("computeAgentReplyNotBefore applies minimum debounce floor", () => {
  const now = new Date("2026-08-11T12:00:00.000Z");
  assert.equal(computeAgentReplyNotBefore(now, 0), "2026-08-11T12:01:00.000Z");
});

test("computeAgentReplyNotBefore adds delay seconds", () => {
  const now = new Date("2026-08-11T12:00:00.000Z");
  assert.equal(
    computeAgentReplyNotBefore(now, 120),
    "2026-08-11T12:02:00.000Z",
  );
});

test("normalizeReplyDelaySeconds clamps to allowed range", () => {
  assert.equal(normalizeReplyDelaySeconds(0), 60);
  assert.equal(normalizeReplyDelaySeconds(30), 60);
  assert.equal(normalizeReplyDelaySeconds(120), 120);
  assert.equal(normalizeReplyDelaySeconds(9999), 3600);
});

test("isValidReplyDelaySeconds accepts 60-3600 only", () => {
  assert.equal(isValidReplyDelaySeconds(0), false);
  assert.equal(isValidReplyDelaySeconds(59), false);
  assert.equal(isValidReplyDelaySeconds(60), true);
  assert.equal(isValidReplyDelaySeconds(120), true);
  assert.equal(isValidReplyDelaySeconds(3601), false);
});
