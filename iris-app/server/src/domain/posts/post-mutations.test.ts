import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeUpdatePost } from "./post-mutations.ts";
import { ValidationError } from "../../api/json.ts";

test("normalizeUpdatePost accepts auto_reply_enabled boolean", () => {
  const update = normalizeUpdatePost({ auto_reply_enabled: true });
  assert.equal(update.autoReplyEnabled, true);
  assert.equal(update.replyMode, "auto");
});

test("normalizeUpdatePost accepts reply_mode", () => {
  const update = normalizeUpdatePost({ reply_mode: "draft" });
  assert.equal(update.replyMode, "draft");
});

test("normalizeUpdatePost rejects invalid auto_reply_enabled", () => {
  assert.throws(
    () => normalizeUpdatePost({ auto_reply_enabled: "yes" }),
    ValidationError,
  );
});

test("normalizeUpdatePost accepts reply_prompt and silence flags", () => {
  const update = normalizeUpdatePost({
    reply_prompt: "Product: R$ 99 — buy at example.com",
    silence_knowledge: true,
    silence_restrictions: false,
  });
  assert.equal(update.replyPrompt, "Product: R$ 99 — buy at example.com");
  assert.equal(update.silenceKnowledge, true);
  assert.equal(update.silenceRestrictions, false);
});

test("normalizeUpdatePost accepts null reply_prompt", () => {
  const update = normalizeUpdatePost({ reply_prompt: null });
  assert.equal(update.replyPrompt, null);
});

test("normalizeUpdatePost rejects reply_prompt over max length", () => {
  assert.throws(
    () => normalizeUpdatePost({ reply_prompt: "x".repeat(32_001) }),
    ValidationError,
  );
});

test("normalizeUpdatePost rejects invalid silence_soul", () => {
  assert.throws(
    () => normalizeUpdatePost({ silence_soul: 1 }),
    ValidationError,
  );
});
