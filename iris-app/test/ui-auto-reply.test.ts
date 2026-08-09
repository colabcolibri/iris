import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("index.html includes auto reply toggle", () => {
  const html = readFileSync("public/index.html", "utf8");
  assert.match(html, /id="auto-reply-enabled"/);
  assert.match(html, /auto_reply_enabled/);
});

test("app.js persists auto_reply_enabled on update", () => {
  const js = readFileSync("public/app.js", "utf8");
  assert.match(js, /autoReplyEnabledEl/);
  assert.match(js, /auto_reply_enabled/);
});
