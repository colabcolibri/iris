import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatReplyWithSignature,
  SIGNATURE_SEPARATOR,
} from "./reply-signature-format.ts";
import { buildSignatureVerificationBlock } from "./prompt-language.ts";
import { defaultReplyPersona } from "../reply-persona-defaults.ts";

test("SIGNATURE_SEPARATOR is newline-dot-newline", () => {
  assert.equal(SIGNATURE_SEPARATOR, "\n.\n");
});

test("formatReplyWithSignature joins body and sign-off with separator", () => {
  assert.equal(
    formatReplyWithSignature("Obrigado pelo comentário!", "— Equipe Iris"),
    "Obrigado pelo comentário!\n.\n— Equipe Iris",
  );
});

test("formatReplyWithSignature returns body when sign-off is empty", () => {
  assert.equal(formatReplyWithSignature("Só o corpo.", ""), "Só o corpo.");
});

test("buildSignatureVerificationBlock documents dot-on-own-line layout", () => {
  const block = buildSignatureVerificationBlock({
    ...defaultReplyPersona(),
    signatureInstruction: "Encerre com — Iris",
  });

  assert.match(block ?? "", /single period character on its own line/i);
  assert.match(block ?? "", /Do NOT use a blank line alone/i);
  assert.match(block ?? "", /\\n\.\\n/);
});
