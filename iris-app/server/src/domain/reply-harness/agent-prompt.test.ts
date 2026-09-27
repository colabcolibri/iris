import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AGENT_LANGUAGE_COMPLEMENTS,
  completeAgentPrompt,
  finalizeAgentPrompt,
} from "./agent-prompt.ts";
import { defaultReplyPersona } from "../settings/reply-persona-defaults.ts";
import { createTestLlmCompletion } from "../../ports/llm-completer.ts";

test("finalizeAgentPrompt appends mandatory language block and complement", () => {
  const persona = { ...defaultReplyPersona(), responseLanguage: "pt-BR" };
  const prompt = finalizeAgentPrompt("Stage body.", persona, "publicReplyOnly");

  assert.match(prompt, /^Stage body\./);
  assert.match(prompt, /Response language \(MANDATORY\)/);
  assert.match(prompt, /Brazilian Portuguese \(pt-BR\)/);
  assert.match(prompt, new RegExp(AGENT_LANGUAGE_COMPLEMENTS.publicReplyOnly));
});

test("completeAgentPrompt wraps body before calling the LLM", async () => {
  let captured = "";
  const persona = { ...defaultReplyPersona(), responseLanguage: "es" };
  const llm = {
    async complete(prompt: string) {
      captured = prompt;
      return createTestLlmCompletion("ok");
    },
  };

  await completeAgentPrompt(llm, persona, "Draft stage.", {
    complement: "triageJsonNote",
    source: "draft",
  });

  assert.match(captured, /Draft stage\./);
  assert.match(captured, /Spanish/);
  assert.match(captured, /reasoning/);
});
