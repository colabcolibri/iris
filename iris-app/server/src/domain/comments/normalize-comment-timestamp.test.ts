import { test } from "node:test";
import assert from "node:assert/strict";
import {
  commentTimestampToMs,
  normalizeCommentTimestamp,
} from "./normalize-comment-timestamp.ts";

test("normalizeCommentTimestamp converts Meta offset without colon to ISO UTC", () => {
  const normalized = normalizeCommentTimestamp("2026-08-10T12:00:00+0000");
  assert.equal(normalized, "2026-08-10T12:00:00.000Z");
  assert.equal(commentTimestampToMs("2026-08-10T12:00:00+0000"), Date.parse("2026-08-10T12:00:00.000Z"));
});

test("normalizeCommentTimestamp keeps null for empty values", () => {
  assert.equal(normalizeCommentTimestamp(null), null);
  assert.equal(normalizeCommentTimestamp(""), null);
});
