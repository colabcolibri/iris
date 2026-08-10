import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("agent auto reply card exposes reply delay controls", () => {
  const card = readFileSync("admin/src/components/settings/agent-auto-reply-card.tsx", "utf8");
  assert.match(card, /replyDelaySeconds/);
  assert.match(card, /saveReplyDelaySeconds/);
  assert.match(card, /Resposta imediata/);
  assert.match(card, /Fila com delay/);
});

test("app settings context loads reply_delay_seconds", () => {
  const context = readFileSync("admin/src/contexts/app-settings-context.tsx", "utf8");
  assert.match(context, /reply_delay_seconds/);
  assert.match(context, /saveReplyDelaySeconds/);
});

test("api client supports reply_delay_seconds on app settings", () => {
  const api = readFileSync("admin/src/lib/api.ts", "utf8");
  assert.match(api, /reply_delay_seconds/);
});
