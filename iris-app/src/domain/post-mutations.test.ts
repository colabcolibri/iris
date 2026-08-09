import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeUpdatePost } from "./post-mutations.ts";
import { ValidationError } from "../api/json.ts";

test("normalizeUpdatePost accepts auto_reply_enabled boolean", () => {
  const update = normalizeUpdatePost({ auto_reply_enabled: true });
  assert.equal(update.autoReplyEnabled, true);
});

test("normalizeUpdatePost rejects invalid auto_reply_enabled", () => {
  assert.throws(
    () => normalizeUpdatePost({ auto_reply_enabled: "yes" }),
    ValidationError,
  );
});
