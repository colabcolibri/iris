import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveEffectivePostReplyStatus,
  resolveEffectivePostReplyStatusFromPost,
  resolvePostReplyMode,
  replyStatusPresentation,
} from "./reply-effective-status.ts";

test("resolvePostReplyMode prefers reply_mode over legacy flag", () => {
  assert.equal(resolvePostReplyMode({ reply_mode: "draft", auto_reply_enabled: true }), "draft");
  assert.equal(resolvePostReplyMode({ auto_reply_enabled: true }), "auto");
  assert.equal(resolvePostReplyMode({}), "off");
});

test("global disabled impera sobre modo do post", () => {
  const paused = resolveEffectivePostReplyStatus(false, "auto");
  assert.equal(paused.kind, "paused");
  if (paused.kind === "paused") {
    assert.equal(paused.configuredMode, "auto");
  }

  assert.deepEqual(resolveEffectivePostReplyStatus(true, "off"), { kind: "off" });
  assert.deepEqual(resolveEffectivePostReplyStatus(true, "auto"), { kind: "auto" });
});

test("resolveEffectivePostReplyStatusFromPost combines post fields", () => {
  const status = resolveEffectivePostReplyStatusFromPost(true, {
    reply_mode: "draft",
  });
  assert.equal(status.kind, "draft");
});

test("replyStatusPresentation covers paused with configured mode", () => {
  const copy = replyStatusPresentation({
    kind: "paused",
    configuredMode: "auto",
  });
  assert.match(copy.label, /pausada/i);
  assert.match(copy.hint ?? "", /automático/i);
});
