import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultAppSettings } from "./app-settings-defaults.ts";
import { resolveAgentReplyTickIntervalMs } from "./resolve-agent-reply-tick-interval.ts";

test("resolveAgentReplyTickIntervalMs reads tick interval from settings", () => {
  const settings = {
    ...defaultAppSettings(),
    agentReplyTickIntervalSeconds: 600,
  };
  assert.equal(resolveAgentReplyTickIntervalMs(settings), 600_000);
});

test("resolveAgentReplyTickIntervalMs ignores reply delay", () => {
  const settings = {
    ...defaultAppSettings(),
    replyDelaySeconds: 300,
    agentReplyTickIntervalSeconds: 180,
  };
  assert.equal(resolveAgentReplyTickIntervalMs(settings), 180_000);
});
