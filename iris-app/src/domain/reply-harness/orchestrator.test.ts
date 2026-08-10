import { test } from "node:test";
import assert from "node:assert/strict";
import { runReplyHarness } from "./orchestrator.ts";
import { defaultAgentContent } from "../agent-content-defaults.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";

function mockContext(): ReplyContext {
  return {
    persona: {
      systemPrompt: "test",
      tone: "amigável",
      brandName: "Iris",
      maxChars: 200,
      updatedAt: new Date().toISOString(),
    },
    post: {
      channel: "instagram",
      status: "published",
      caption: "Novo produto",
      scheduledAt: null,
      publishedAt: new Date().toISOString(),
      assets: [],
    },
    thread: { entries: [] },
    imageContext: { summaries: [] },
    targetComment: {
      authorUsername: "fan",
      text: "Qual o preço?",
    },
  };
}

test("runReplyHarness stops after triage failure", async () => {
  let calls = 0;
  const llm: LlmCompleter = {
    async complete() {
      calls += 1;
      return JSON.stringify({
        replyTier: "none",
        reason: "off_topic",
        reasoning: "Pergunta fora do post",
      });
    },
  };

  const result = await runReplyHarness({
    context: mockContext(),
    agentContent: defaultAgentContent(),
    llm,
  });

  assert.equal(result.terminalStatus, "skipped_triage");
  assert.equal(result.replyTier, "none");
  assert.equal(result.steps.length, 1);
  assert.equal(calls, 1);
});

test("runReplyHarness approves full pipeline", async () => {
  let step = 0;
  const llm: LlmCompleter = {
    async complete(prompt) {
      step += 1;
      if (step === 1) {
        return JSON.stringify({ replyTier: "full", reason: "ok", reasoning: "legítimo" });
      }
      if (step === 2) {
        return "Olá! Obrigado pelo interesse.";
      }
      return JSON.stringify({
        approved: true,
        reason: "ok",
        reasoning: "adequado",
        finalText: "Olá! Obrigado pelo interesse.",
      });
    },
  };

  const result = await runReplyHarness({
    context: mockContext(),
    agentContent: defaultAgentContent(),
    llm,
  });

  assert.equal(result.terminalStatus, "approved");
  assert.equal(result.finalText, "Olá! Obrigado pelo interesse.");
  assert.equal(result.steps.length, 3);
});

test("runReplyHarness rejects at verify", async () => {
  let step = 0;
  const llm: LlmCompleter = {
    async complete() {
      step += 1;
      if (step === 1) {
        return JSON.stringify({ replyTier: "full", reason: "ok", reasoning: "ok" });
      }
      if (step === 2) {
        return "texto ruim";
      }
      return JSON.stringify({ approved: false, reason: "off_brand", reasoning: "inadequado" });
    },
  };

  const result = await runReplyHarness({
    context: mockContext(),
    agentContent: defaultAgentContent(),
    llm,
  });

  assert.equal(result.terminalStatus, "rejected_verify");
  assert.equal(result.finalText, null);
});

test("runReplyHarness simple tier skips verify", async () => {
  let calls = 0;
  const llm: LlmCompleter = {
    async complete(prompt) {
      calls += 1;
      if (calls === 1) {
        assert.match(prompt, /Restrições da marca/);
        assert.doesNotMatch(prompt, /## SOUL do agente/);
        return JSON.stringify({ replyTier: "simple", reason: "thanks", reasoning: "agradecimento" });
      }
      assert.match(prompt, /UMA resposta curta/);
      assert.doesNotMatch(prompt, /## SOUL/);
      return "Obrigada pelo carinho! 💙";
    },
  };

  const result = await runReplyHarness({
    context: mockContext(),
    agentContent: defaultAgentContent(),
    llm,
  });

  assert.equal(result.terminalStatus, "approved_simple");
  assert.equal(result.replyTier, "simple");
  assert.equal(result.finalText, "Obrigada pelo carinho! 💙");
  assert.equal(result.steps.length, 2);
  assert.equal(calls, 2);
});
