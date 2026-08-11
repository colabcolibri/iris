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
