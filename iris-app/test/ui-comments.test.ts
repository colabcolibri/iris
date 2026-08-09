import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("index.html includes comments panel", () => {
  const html = readFileSync("public/index.html", "utf8");
  assert.match(html, /id="comments-panel"/);
  assert.match(html, /class="comments-panel"/);
});

test("style.css defines comment panel styles", () => {
  const css = readFileSync("public/style.css", "utf8");
  assert.match(css, /\.comments-panel/);
  assert.match(css, /\.comment-item/);
});
