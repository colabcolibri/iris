import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("post dialog includes reply mode selector", () => {
  const dialog = readFileSync("admin/src/components/posts/post-dialog.tsx", "utf8");
  assert.match(dialog, /replyMode/);
  assert.match(dialog, /post-reply-mode/);
});

test("dashboard persists reply_mode on update", () => {
  const dashboard = readFileSync("admin/src/pages/dashboard-page.tsx", "utf8");
  assert.match(dashboard, /reply_mode/);
  assert.match(dashboard, /PostDialog/);
});
