import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveHarnessAuditMeta } from "./derive-harness-audit-meta.ts";

test("deriveHarnessAuditMeta uses triage json when steps are absent", () => {
  const meta = deriveHarnessAuditMeta({
    status: "ok",
    outputSummary: "Olá!",
    triageOutputJson: JSON.stringify({
      shouldReply: true,
      replyTier: "simple",
      blockCategory: "none",
      reason: "ok",
      reasoning: "ok",
    }),
  });

  assert.equal(meta.replyTier, "simple");
  assert.equal(meta.terminalStatus, "approved_simple");
});

test("deriveHarnessAuditMeta maps failed run without steps", () => {
  const meta = deriveHarnessAuditMeta({
    status: "failed",
    outputSummary: "LLM timeout",
  });

  assert.equal(meta.terminalStatus, "rejected_verify");
  assert.equal(meta.replyTier, null);
});
