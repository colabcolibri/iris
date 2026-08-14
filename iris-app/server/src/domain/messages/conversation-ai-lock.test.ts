import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  computeAiLockUntil,
  isConversationAiLocked,
  isConversationAiLockExpired,
  normalizeAiLockDays,
} from "./conversation-ai-lock.ts";

describe("conversation ai lock", () => {
  test("normalizes lock days within bounds", () => {
    assert.equal(normalizeAiLockDays(5), 5);
    assert.equal(normalizeAiLockDays(0), 5);
    assert.equal(normalizeAiLockDays(120), 90);
  });

  test("detects active and expired locks", () => {
    const now = new Date("2026-08-14T12:00:00.000Z");
    const active = { aiLockedUntil: "2026-08-20T12:00:00.000Z" };
    const expired = { aiLockedUntil: "2026-08-10T12:00:00.000Z" };

    assert.equal(isConversationAiLocked(active, now), true);
    assert.equal(isConversationAiLockExpired(active, now), false);
    assert.equal(isConversationAiLocked(expired, now), false);
    assert.equal(isConversationAiLockExpired(expired, now), true);
  });

  test("computes lock until from days", () => {
    const until = computeAiLockUntil(new Date("2026-08-14T12:00:00.000Z"), 5);
    assert.equal(until, "2026-08-19T12:00:00.000Z");
  });
});
