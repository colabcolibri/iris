import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBrandAndSignatureBlock } from "./prompt-language.ts";
import { defaultReplyPersona } from "../reply-persona-defaults.ts";

test("buildBrandAndSignatureBlock includes brand and signature", () => {
  const block = buildBrandAndSignatureBlock({
    ...defaultReplyPersona(),
    brandName: "Colab",
    signatureInstruction: "Sign off with — Team Colab",
  });

  assert.match(block ?? "", /Brand: Colab/);
  assert.match(block ?? "", /Signature instruction/);
  assert.match(block ?? "", /Team Colab/);
});

test("buildBrandAndSignatureBlock returns null when empty", () => {
  assert.equal(buildBrandAndSignatureBlock(defaultReplyPersona()), null);
});
