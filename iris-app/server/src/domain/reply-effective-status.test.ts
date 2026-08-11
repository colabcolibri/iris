import { test } from "node:test";
import assert from "node:assert/strict";
import {
  replyStatusPresentation,
  resolveEffectivePostReplyStatus,
  resolveEffectivePostReplyStatusFromPost,
  resolvePostReplyModeSetting,
  resolveReplyPolicy,
} from "./reply-effective-status.ts";
import { resolveEffectiveReplyMode } from "./reply-mode.ts";

test("resolvePostReplyModeSetting prefers reply_mode and supports inherit", () => {
  assert.equal(
    resolvePostReplyModeSetting({ reply_mode: "inherit", auto_reply_enabled: true }),
    "inherit",
  );
  assert.equal(
    resolvePostReplyModeSetting({ reply_mode: "draft", auto_reply_enabled: true }),
    "draft",
  );
  assert.equal(resolvePostReplyModeSetting({ auto_reply_enabled: true }), "auto");
  assert.equal(resolvePostReplyModeSetting({}), "off");
});

test("resolveEffectiveReplyMode applies post precedence over global", () => {
  assert.equal(resolveEffectiveReplyMode("off", "inherit"), "off");
  assert.equal(resolveEffectiveReplyMode("auto", "inherit"), "auto");
  assert.equal(resolveEffectiveReplyMode("off", "auto"), "auto");
  assert.equal(resolveEffectiveReplyMode("auto", "off"), "off");
});

test("resolveReplyPolicy combines global and post settings", () => {
  assert.deepEqual(resolveReplyPolicy("draft", { reply_mode: "inherit" }), {
    globalMode: "draft",
    postSetting: "inherit",
    effectiveMode: "draft",
  });
  assert.deepEqual(resolveReplyPolicy("off", { reply_mode: "auto" }), {
    globalMode: "off",
    postSetting: "auto",
    effectiveMode: "auto",
  });
});

test("resolveEffectivePostReplyStatus marks inherited posts", () => {
  assert.deepEqual(resolveEffectivePostReplyStatus("auto", "inherit"), {
    kind: "auto",
    inherited: true,
  });
  assert.deepEqual(resolveEffectivePostReplyStatus("off", "draft"), {
    kind: "draft",
    inherited: false,
  });
});

test("resolveEffectivePostReplyStatusFromPost combines post fields", () => {
  const status = resolveEffectivePostReplyStatusFromPost("auto", {
    reply_mode: "draft",
  });
  assert.equal(status.kind, "draft");
  assert.equal(status.inherited, false);
});

test("replyStatusPresentation covers inherited modes", () => {
  const copy = replyStatusPresentation({ kind: "auto", inherited: true });
  assert.match(copy.label, /global/i);
});
