import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const adminRoot = join(import.meta.dirname, "../../admin/src");

test("auto monitor card is wired on settings page", () => {
  const page = readFileSync(join(adminRoot, "pages/settings-page.tsx"), "utf8");
  assert.match(page, /AutoMonitorCard/);
  const card = readFileSync(
    join(adminRoot, "components/settings/auto-monitor-card.tsx"),
    "utf8",
  );
  assert.match(card, /autoMonitorEnabled/);
  assert.match(card, /autoMonitorIntervalSeconds/);
});

test("app settings context loads auto monitor fields", () => {
  const context = readFileSync(join(adminRoot, "contexts/app-settings-context.tsx"), "utf8");
  assert.match(context, /auto_monitor_enabled/);
  assert.match(context, /auto_monitor_interval_seconds/);
});

test("api client supports auto monitor on app settings", () => {
  const api = readFileSync(join(adminRoot, "lib/api.ts"), "utf8");
  assert.match(api, /auto_monitor_enabled/);
  assert.match(api, /auto_monitor_interval_seconds/);
});
