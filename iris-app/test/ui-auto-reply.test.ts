import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("post dialog includes auto reply toggle", () => {
  const dialog = readFileSync("admin/src/components/posts/post-dialog.tsx", "utf8");
  assert.match(dialog, /autoReply/);
  assert.match(dialog, /Resposta automática/);
});

test("dashboard persists auto_reply_enabled on update", () => {
  const dashboard = readFileSync("admin/src/pages/dashboard-page.tsx", "utf8");
  assert.match(dashboard, /auto_reply_enabled/);
  assert.match(dashboard, /PostDialog/);
});
