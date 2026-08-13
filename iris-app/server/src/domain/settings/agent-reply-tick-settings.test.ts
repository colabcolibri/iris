import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AGENT_REPLY_TICK_INTERVAL_DEFAULT_SECONDS,
  AGENT_REPLY_TICK_PRESETS_SECONDS,
  isValidAgentReplyTickIntervalSeconds,
  normalizeAgentReplyTickIntervalSeconds,
} from "./agent-reply-tick-settings.ts";

test("isValidAgentReplyTickIntervalSeconds accepts presets only", () => {
  for (const preset of AGENT_REPLY_TICK_PRESETS_SECONDS) {
    assert.equal(isValidAgentReplyTickIntervalSeconds(preset), true);
  }
  assert.equal(isValidAgentReplyTickIntervalSeconds(60), false);
  assert.equal(isValidAgentReplyTickIntervalSeconds(240), false);
});

test("normalizeAgentReplyTickIntervalSeconds falls back to default", () => {
  assert.equal(normalizeAgentReplyTickIntervalSeconds(300), 300);
  assert.equal(normalizeAgentReplyTickIntervalSeconds(999), AGENT_REPLY_TICK_INTERVAL_DEFAULT_SECONDS);
});
