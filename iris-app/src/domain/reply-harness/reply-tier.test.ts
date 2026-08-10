import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeReplyTier, simpleReplyMaxChars } from "./reply-tier.ts";

test("normalizeReplyTier prefers explicit replyTier", () => {
  assert.equal(normalizeReplyTier({ replyTier: "simple", reason: "", reasoning: "" }), "simple");
  assert.equal(normalizeReplyTier({ replyTier: "none", reason: "", reasoning: "" }), "none");
});

test("normalizeReplyTier maps legacy shouldReply", () => {
  assert.equal(normalizeReplyTier({ shouldReply: false, reason: "", reasoning: "" }), "none");
  assert.equal(normalizeReplyTier({ shouldReply: true, reason: "", reasoning: "" }), "full");
});

test("simpleReplyMaxChars caps and scales persona limit", () => {
  assert.equal(simpleReplyMaxChars(500), 180);
  assert.equal(simpleReplyMaxChars(120), 80);
});
