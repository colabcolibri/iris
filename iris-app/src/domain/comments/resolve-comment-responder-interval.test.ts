import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COMMENT_RESPONDER_INTERVAL_IMMEDIATE_MS,
  COMMENT_RESPONDER_INTERVAL_WITH_DELAY_MS,
  resolveCommentResponderIntervalMs,
} from "./resolve-comment-responder-interval.ts";

test("resolveCommentResponderIntervalMs uses immediate poll when delay is 0", () => {
  assert.equal(resolveCommentResponderIntervalMs(0), COMMENT_RESPONDER_INTERVAL_IMMEDIATE_MS);
});

test("resolveCommentResponderIntervalMs uses faster poll when delay queue is enabled", () => {
  assert.equal(resolveCommentResponderIntervalMs(90), COMMENT_RESPONDER_INTERVAL_WITH_DELAY_MS);
});
