import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildBrandBlock,
  buildSignatureVerificationBlock,
} from "./prompt-language.ts";
import { defaultReplyPersona } from "../reply-persona-defaults.ts";

test("buildBrandBlock includes brand only", () => {
  const block = buildBrandBlock({
    ...defaultReplyPersona(),
    brandName: "Colab",
    signatureInstruction: "Sign off with — Team Colab",
  });

  assert.equal(block, "Brand: Colab");
});

test("buildBrandBlock returns null when brand is empty", () => {
  assert.equal(buildBrandBlock(defaultReplyPersona()), null);
});

test("buildSignatureVerificationBlock guides natural closing without rigid script", () => {
  const block = buildSignatureVerificationBlock({
    ...defaultReplyPersona(),
    signatureInstruction: "Always end with — Iris",
  });

  assert.match(block ?? "", /Closing voice/);
  assert.match(block ?? "", /not a fixed script/i);
  assert.match(block ?? "", /Wording may vary/i);
  assert.match(block ?? "", /— Iris/);
});

test("buildSignatureVerificationBlock returns null when instruction is empty", () => {
  assert.equal(buildSignatureVerificationBlock(defaultReplyPersona()), null);
});
