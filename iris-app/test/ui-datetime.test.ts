import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  toDatetimeLocalFromIso,
  toIsoFromDatetimeLocal,
} from "../src/domain/datetime-ui.ts";

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "../public");

test("datetime converts local input to iso", () => {
  const iso = toIsoFromDatetimeLocal("2026-08-12T18:00");
  assert.ok(iso);
  assert.match(iso!, /2026-08-12/);
});

test("datetime converts iso to datetime-local", () => {
  const local = toDatetimeLocalFromIso("2026-08-12T18:00:00.000Z");
  assert.match(local, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
});

test("index.html includes editorial shell", () => {
  const html = readFileSync(join(PUBLIC_DIR, "index.html"), "utf8");
  assert.match(html, /id="calendar-view"/);
  assert.match(html, /id="post-form"/);
  assert.match(html, /style\.css/);
});

test("style.css defines status badges", () => {
  const css = readFileSync(join(PUBLIC_DIR, "style.css"), "utf8");
  for (const status of ["draft", "scheduled", "published", "cancelled", "failed"]) {
    assert.match(css, new RegExp(`data-status="${status}"`));
  }
});
