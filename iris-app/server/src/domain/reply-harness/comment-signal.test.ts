import assert from "node:assert/strict";
import { test } from "node:test";
import {
  describeCommentSignal,
  detectCommentSignal,
  isLowEvidenceSignal,
} from "./comment-signal.ts";

test("detectCommentSignal: Sim ! is acknowledgment", () => {
  assert.equal(detectCommentSignal("Sim !"), "acknowledgment");
  assert.equal(detectCommentSignal("sim"), "acknowledgment");
  assert.equal(detectCommentSignal("Isso!"), "acknowledgment");
  assert.equal(detectCommentSignal("ok ok"), "acknowledgment");
  assert.ok(isLowEvidenceSignal("acknowledgment"));
});

test("detectCommentSignal: emoji and laughter", () => {
  assert.equal(detectCommentSignal("❤️"), "emoji_reaction");
  assert.equal(detectCommentSignal("🔥🔥"), "emoji_reaction");
  assert.equal(detectCommentSignal("kkk"), "laughter");
  assert.equal(detectCommentSignal("haha"), "laughter");
  assert.equal(detectCommentSignal("rsrs"), "laughter");
});

test("detectCommentSignal: substantive stays substantive", () => {
  assert.equal(
    detectCommentSignal("Sim, porque o tanto faz vira conflito se eu perguntar."),
    "substantive",
  );
  assert.equal(
    detectCommentSignal("Olá! Estas interpretações podem ser incrementadas."),
    "substantive",
  );
  assert.ok(!isLowEvidenceSignal("substantive"));
});

test("describeCommentSignal mentions non-invention for ack", () => {
  assert.match(describeCommentSignal("acknowledgment"), /without a clear claim/i);
});
