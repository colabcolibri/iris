import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTriagePrompt } from "./build-harness-prompt.ts";
import { defaultAgentContent } from "../agent-content-defaults.ts";
import { defaultReplyPersona } from "../reply-persona-defaults.ts";
import type { ReplyContext } from "../reply-context/types.ts";

function mockContext(responseLanguage = "pt-BR"): ReplyContext {
  return {
    persona: { ...defaultReplyPersona(), responseLanguage, brandName: "Iris" },
    post: {
      channel: "instagram",
      status: "published",
      caption: "New product",
      scheduledAt: null,
      publishedAt: new Date().toISOString(),
      assets: [],
    },
    thread: { entries: [] },
    imageContext: { summaries: [] },
    targetComment: { authorUsername: "fan", text: "How much?" },
  };
}

test("harness prompts are written in English", () => {
  const prompt = buildTriagePrompt(mockContext(), defaultAgentContent().restrictions);
  assert.match(prompt, /You classify Instagram comments/);
  assert.match(prompt, /Reply with valid JSON only/);
  assert.doesNotMatch(prompt, /Você classifica/);
});

test("harness prompts inject mandatory response language", () => {
  const prompt = buildTriagePrompt(mockContext("fr"), defaultAgentContent().restrictions);
  assert.match(prompt, /Response language \(MANDATORY\)/);
  assert.match(prompt, /French/);
});
