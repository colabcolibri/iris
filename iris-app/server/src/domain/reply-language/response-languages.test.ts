import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_RESPONSE_LANGUAGE,
  isSupportedResponseLanguage,
  resolveResponseLanguage,
} from "./response-languages.ts";
import { buildResponseLanguageDirective } from "../reply-harness/prompt-language.ts";
import { defaultReplyPersona } from "../settings/reply-persona-defaults.ts";

test("resolveResponseLanguage falls back to default", () => {
  const resolved = resolveResponseLanguage("invalid");
  assert.equal(resolved.code, DEFAULT_RESPONSE_LANGUAGE);
  assert.equal(isSupportedResponseLanguage("pt-BR"), true);
});

test("buildResponseLanguageDirective reinforces public reply language", () => {
  const persona = { ...defaultReplyPersona(), responseLanguage: "es" };
  const block = buildResponseLanguageDirective(persona, { forPublicReply: true });
  assert.match(block, /MANDATORY/);
  assert.match(block, /Spanish/);
  assert.match(block, /MUST be written entirely/);
});
