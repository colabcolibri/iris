import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isWithinMessageImportWindow,
  messageImportCutoffMs,
} from "./message-sync-window.ts";

test("message import window accepts messages within 30 days", () => {
  const now = Date.parse("2026-08-13T12:00:00.000Z");
  const recent = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(isWithinMessageImportWindow(recent, now), true);
});

test("message import window rejects messages older than 30 days", () => {
  const now = Date.parse("2026-08-13T12:00:00.000Z");
  const old = new Date(messageImportCutoffMs(now) - 1).toISOString();
  assert.equal(isWithinMessageImportWindow(old, now), false);
});
