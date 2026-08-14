import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatTriageReason,
  normalizeReplyTier,
  normalizeTriageOutput,
  simpleReplyMaxChars,
} from "./reply-tier.ts";

test("normalizeReplyTier prefers explicit replyTier", () => {
  assert.equal(normalizeReplyTier({ replyTier: "simple", reason: "", reasoning: "" }), "simple");
  assert.equal(normalizeReplyTier({ replyTier: "none", reason: "", reasoning: "" }), "none");
});

test("normalizeReplyTier maps legacy shouldReply", () => {
  assert.equal(normalizeReplyTier({ shouldReply: false, reason: "", reasoning: "" }), "none");
  assert.equal(normalizeReplyTier({ shouldReply: true, reason: "", reasoning: "" }), "full");
});

test("normalizeTriageOutput forces none when blockCategory is set", () => {
  const triage = normalizeTriageOutput({
    shouldReply: true,
    replyTier: "full",
    blockCategory: "harmful",
    reason: "insulto",
    reasoning: "ofensivo",
  });

  assert.equal(triage.replyTier, "none");
  assert.equal(triage.shouldReply, false);
  assert.equal(triage.blockCategory, "harmful");
});

test("normalizeTriageOutput accepts crisis and hate_violence", () => {
  const crisis = normalizeTriageOutput({
    shouldReply: true,
    replyTier: "simple",
    blockCategory: "crisis",
    reason: "risk",
    reasoning: "self-harm",
  });
  assert.equal(crisis.blockCategory, "crisis");
  assert.equal(crisis.shouldReply, false);
  assert.equal(crisis.replyTier, "none");

  const hate = normalizeTriageOutput({
    shouldReply: false,
    replyTier: "none",
    blockCategory: "hate_violence",
    reason: "hate",
    reasoning: "advocacy",
  });
  assert.equal(hate.blockCategory, "hate_violence");
});

test("normalizeTriageOutput accepts not_for_brand", () => {
  const triage = normalizeTriageOutput({
    shouldReply: false,
    replyTier: "none",
    blockCategory: "not_for_brand",
    reason: "peer_conversation",
    reasoning: "User replied to another follower, not the brand.",
  });

  assert.equal(triage.blockCategory, "not_for_brand");
  assert.equal(triage.shouldReply, false);
  assert.equal(triage.replyTier, "none");
});

test("normalizeTriageOutput accepts conversation_stalled", () => {
  const triage = normalizeTriageOutput({
    shouldReply: false,
    replyTier: "none",
    blockCategory: "conversation_stalled",
    reason: "conversation_stalled",
    reasoning: "Thanks after brand already answered.",
  });

  assert.equal(triage.blockCategory, "conversation_stalled");
  assert.equal(triage.shouldReply, false);
});

test("formatTriageReason includes block and tier prefixes", () => {
  const formatted = formatTriageReason({
    shouldReply: false,
    replyTier: "none",
    blockCategory: "spam",
    reason: "promo",
    reasoning: "spam",
  });

  assert.match(formatted, /block:spam/);
  assert.match(formatted, /tier:none/);
  assert.match(formatted, /promo/);
});

test("simpleReplyMaxChars caps and scales persona limit", () => {
  assert.equal(simpleReplyMaxChars(500), 180);
  assert.equal(simpleReplyMaxChars(120), 80);
});
