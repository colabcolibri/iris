import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildBrandBlock,
  buildMentionDirective,
  buildSignatureVerificationBlock,
} from "./prompt-language.ts";
import { defaultReplyPersona } from "../reply-persona-defaults.ts";
import type { ReplyContext } from "../reply-context/types.ts";

function mockContext(authorUsername = "maria_escuta"): ReplyContext {
  return {
    persona: defaultReplyPersona(),
    post: null,
    thread: { entries: [] },
    imageContext: { summaries: [] },
    targetComment: { authorUsername, text: "Adorei o post!" },
  };
}

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

test("buildMentionDirective requires @ in reply body when handle is known", () => {
  const block = buildMentionDirective(mockContext("maria_escuta"));

  assert.match(block ?? "", /Mention the commenter \(MANDATORY\)/);
  assert.match(block ?? "", /@maria_escuta/);
  assert.match(block ?? "", /not only in a closing signature/i);
});

test("buildMentionDirective returns null without a real handle", () => {
  assert.equal(buildMentionDirective(mockContext(null)), null);
  assert.equal(buildMentionDirective(mockContext("user")), null);
});
