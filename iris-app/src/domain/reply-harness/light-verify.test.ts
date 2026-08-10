import { test } from "node:test";
import assert from "node:assert/strict";
import { runCodeLightVerify } from "./light-verify.ts";

test("runCodeLightVerify rejects harmful language", () => {
  const result = runCodeLightVerify("isso é uma merda");
  assert.equal(result.approved, false);
  assert.equal(result.harmful, true);
  assert.ok(result.policyViolations.includes("harmful_language"));
});

test("runCodeLightVerify approves clean short reply", () => {
  const result = runCodeLightVerify("Obrigada pelo carinho!");
  assert.equal(result.approved, true);
  assert.equal(result.harmful, false);
});
