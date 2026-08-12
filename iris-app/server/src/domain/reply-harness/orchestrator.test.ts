import { test } from "node:test";
import assert from "node:assert/strict";
import { runReplyHarness } from "./orchestrator.ts";
import { defaultAgentContent } from "../settings/agent-content-defaults.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import { createTestLlmCompletion } from "../../ports/llm-completer.ts";

function mockContext(): ReplyContext {
  return {
    persona: {
      brandName: "Iris",
      responseLanguage: "pt-BR",
      maxChars: 200,
      updatedAt: new Date().toISOString(),
    },
    post: {
      postId: "p1",
      channel: "instagram",
      status: "published",
      caption: "Novo produto",
      carouselSummary: null,
      scheduledAt: null,
      publishedAt: new Date().toISOString(),
      assets: [],
    },
    thread: { entries: [] },
    imageContext: { summaries: [], visionEnabled: false },
    brandUsername: null,
    targetComment: {
      authorUsername: "fan",
      text: "Qual o preço?",
      igCommentId: null,
    },
  };
}

test("runReplyHarness stops after triage failure", async () => {
  let calls = 0;
  const llm: LlmCompleter = {
    async complete() {
      calls += 1;
      return createTestLlmCompletion(
        JSON.stringify({
          shouldReply: false,
          replyTier: "none",
          blockCategory: "off_topic",
          reason: "off_topic",
          reasoning: "Pergunta fora do post",
        }),
      );
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
  assert.equal(result.steps[0]?.llm?.model, "test-model");
});

test("runReplyHarness blocks harmful at triage", async () => {
  const llm: LlmCompleter = {
    async complete() {
      return createTestLlmCompletion(
        JSON.stringify({
          shouldReply: false,
          replyTier: "none",
          blockCategory: "harmful",
          reason: "insulto",
          reasoning: "linguagem ofensiva",
        }),
      );
    },
  };

  const result = await runReplyHarness({
    context: mockContext(),
    agentContent: defaultAgentContent(),
    llm,
  });

  assert.equal(result.terminalStatus, "blocked_harmful");
  assert.match(result.steps[0]?.reason ?? "", /block:harmful/);
});

test("runReplyHarness approves full pipeline", async () => {
  let step = 0;
  const llm: LlmCompleter = {
    async complete() {
      step += 1;
      if (step === 1) {
        return createTestLlmCompletion(
          JSON.stringify({
            shouldReply: true,
            replyTier: "full",
            blockCategory: "none",
            reason: "ok",
            reasoning: "legítimo",
          }),
        );
      }
      if (step === 2) {
        return createTestLlmCompletion("Olá! Obrigado pelo interesse.");
      }
      return createTestLlmCompletion(
        JSON.stringify({
          approved: true,
          harmful: false,
          policyViolations: [],
          reason: "ok",
          reasoning: "adequado",
          finalText: "Olá! Obrigado pelo interesse.",
        }),
      );
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
        return createTestLlmCompletion(
          JSON.stringify({
            shouldReply: true,
            replyTier: "full",
            blockCategory: "none",
            reason: "ok",
            reasoning: "ok",
          }),
        );
      }
      if (step === 2) {
        return createTestLlmCompletion("texto ruim");
      }
      return createTestLlmCompletion(
        JSON.stringify({
          approved: false,
          harmful: true,
          policyViolations: ["harmful"],
          reason: "off_brand",
          reasoning: "inadequado",
        }),
      );
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

test("runReplyHarness simple tier runs light verify", async () => {
  let calls = 0;
  const llm: LlmCompleter = {
    async complete(prompt) {
      calls += 1;
      if (calls === 1) {
        assert.match(prompt, /Brand restrictions/);
        assert.match(prompt, /Response language \(MANDATORY\)/);
        assert.doesNotMatch(prompt, /## SOUL/);
        return createTestLlmCompletion(
          JSON.stringify({
            shouldReply: true,
            replyTier: "simple",
            blockCategory: "none",
            reason: "thanks",
            reasoning: "agradecimento",
          }),
        );
      }
      if (calls === 2) {
        assert.match(prompt, /ONE short Instagram/);
        assert.doesNotMatch(prompt, /## SOUL/);
        return createTestLlmCompletion("Obrigada pelo carinho! 💙");
      }
      return createTestLlmCompletion(
        JSON.stringify({
          approved: true,
          harmful: false,
          policyViolations: [],
          reason: "ok",
          reasoning: "ok",
        }),
      );
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
  assert.equal(result.steps.length, 3);
  assert.equal(calls, 3);
});

test("runReplyHarness simple tier rejects harmful draft via code guard", async () => {
  let calls = 0;
  const llm: LlmCompleter = {
    async complete() {
      calls += 1;
      if (calls === 1) {
        return createTestLlmCompletion(
          JSON.stringify({
            shouldReply: true,
            replyTier: "simple",
            blockCategory: "none",
            reason: "ok",
            reasoning: "ok",
          }),
        );
      }
      return createTestLlmCompletion("vai se foder");
    },
  };

  const result = await runReplyHarness({
    context: mockContext(),
    agentContent: defaultAgentContent(),
    llm,
  });

  assert.equal(result.terminalStatus, "rejected_verify");
  assert.equal(result.steps.length, 3);
  assert.equal(result.steps[2]?.stage, "verify");
});

test("runReplyHarness skips triage when comment is not for the brand", async () => {
  const llm: LlmCompleter = {
    async complete() {
      return createTestLlmCompletion(
        JSON.stringify({
          shouldReply: false,
          replyTier: "none",
          blockCategory: "not_for_brand",
          reason: "peer_conversation",
          reasoning: "Target replied to another user, not the brand.",
        }),
      );
    },
  };

  const result = await runReplyHarness({
    context: mockContext(),
    agentContent: defaultAgentContent(),
    llm,
  });

  assert.equal(result.terminalStatus, "skipped_triage");
  assert.equal(result.replyTier, "none");
  assert.equal(result.steps[0]?.blockCategory, "not_for_brand");
});
