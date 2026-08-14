import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("agent auto reply card exposes reply delay, max age, and tick interval controls", () => {
  const card = readFileSync("../admin/src/components/settings/agent-auto-reply-card.tsx", "utf8");
  assert.match(card, /replyDelaySeconds/);
  assert.match(card, /saveReplyDelaySeconds/);
  assert.match(card, /replyMaxAgeDays/);
  assert.match(card, /saveReplyMaxAgeDays/);
  assert.match(card, /agentReplyTickIntervalSeconds/);
  assert.match(card, /saveAgentReplyTickIntervalSeconds/);
  assert.match(card, /t\.workerIntervalLabel/);
  assert.match(card, /t\.maxAgeLabel/);
  assert.match(card, /t\.delayImmediate/);
  assert.match(card, /t\.delayQueued/);
  assert.match(card, /t\.delayMinutesLabel/);
});

test("message agent card shows shared tick interval and delay in minutes", () => {
  const card = readFileSync(
    "../admin/src/components/settings/message-agent-auto-reply-card.tsx",
    "utf8",
  );
  assert.match(card, /agentReplyTickIntervalSeconds/);
  assert.match(card, /t\.delayMinutesLabel/);
  assert.match(card, /t\.workerIntervalHint/);
});

test("app settings context loads reply and tick fields", () => {
  const context = readFileSync("../admin/src/contexts/app-settings-context.tsx", "utf8");
  assert.match(context, /reply_delay_seconds/);
  assert.match(context, /reply_max_age_days/);
  assert.match(context, /agent_reply_tick_interval_seconds/);
  assert.match(context, /saveReplyDelaySeconds/);
  assert.match(context, /saveAgentReplyTickIntervalSeconds/);
});

test("api client supports agent reply tick on app settings", () => {
  const api = readFileSync("../admin/src/lib/api.ts", "utf8");
  assert.match(api, /reply_delay_seconds/);
  assert.match(api, /reply_max_age_days/);
  assert.match(api, /agent_reply_tick_interval_seconds/);
});
