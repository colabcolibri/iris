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

test("runReplyHarness crisis barrier uses LLM reply with CVV checklist", async () => {
  let calls = 0;
  const llm: LlmCompleter = {
    async complete(prompt) {
      calls += 1;
      if (calls === 1) {
        return createTestLlmCompletion(
          JSON.stringify({
            shouldReply: false,
            replyTier: "none",
            blockCategory: "crisis",
            reason: "life_risk",
            reasoning: "explicit wish to die",
          }),
        );
      }
      assert.match(prompt, /Barrier kind: crisis/);
      assert.match(prompt, /CVV|188/);
      return createTestLlmCompletion(
        JSON.stringify({
          finalText:
            "@vera Sinto muito por esse momento. Você não precisa passar por isso sozinha — no Brasil o CVV atende no 188 ou em https://www.cvv.org.br.",
          reasoning: "life risk phrasing",
        }),
      );
    },
  };

  const context = mockContext();
  context.targetComment = {
    authorUsername: "vera",
    text: "Quero morrer",
    igCommentId: "c-crisis",
  };

  const result = await runReplyHarness({
    context,
    agentContent: defaultAgentContent(),
    llm,
  });

  assert.equal(result.terminalStatus, "barrier_reply");
  assert.equal(calls, 2);
  assert.equal(result.steps.length, 2);
  assert.equal(result.steps[1]?.stage, "draft");
  assert.match(result.steps[1]?.reason ?? "", /barrier_llm:crisis/);
  assert.match(result.finalText ?? "", /@vera/);
  assert.match(result.finalText ?? "", /188/);
  assert.match(result.finalText ?? "", /CVV/i);
  assert.match(result.steps[0]?.reason ?? "", /block:crisis/);
});

test("runReplyHarness hate_violence barrier uses LLM informative refusal", async () => {
  let calls = 0;
  const llm: LlmCompleter = {
    async complete() {
      calls += 1;
      if (calls === 1) {
        return createTestLlmCompletion(
          JSON.stringify({
            shouldReply: false,
            replyTier: "none",
            blockCategory: "hate_violence",
            reason: "nazi",
            reasoning: "advocacy",
          }),
        );
      }
      return createTestLlmCompletion(
        JSON.stringify({
          finalText:
            "@troll Como assistente virtual, não participo de ódio ou apologia a violência. Se quiser falar do post com respeito, estou aqui.",
          reasoning: "hate advocacy",
        }),
      );
    },
  };

  const context = mockContext();
  context.targetComment = {
    authorUsername: "troll",
    text: "viva o nazismo",
    igCommentId: "c-hate",
  };

  const result = await runReplyHarness({
    context,
    agentContent: defaultAgentContent(),
    llm,
  });

  assert.equal(result.terminalStatus, "barrier_reply");
  assert.equal(calls, 2);
  assert.match(result.finalText ?? "", /assistente virtual/i);
  assert.match(result.finalText ?? "", /não participo/i);
});

test("runReplyHarness en crisis barrier uses LLM local-help wording", async () => {
  let calls = 0;
  const llm: LlmCompleter = {
    async complete() {
      calls += 1;
      if (calls === 1) {
        return createTestLlmCompletion(
          JSON.stringify({
            shouldReply: false,
            replyTier: "none",
            blockCategory: "crisis",
            reason: "crisis",
            reasoning: "self-harm",
          }),
        );
      }
      return createTestLlmCompletion(
        JSON.stringify({
          finalText:
            "@alex I'm sorry you're hurting. Please reach a local crisis hotline or emergency services now — you don't have to face this alone.",
          reasoning: "en crisis",
        }),
      );
    },
  };

  const context = mockContext();
  context.persona.responseLanguage = "en-US";
  context.targetComment = {
    authorUsername: "alex",
    text: "I want to kill myself",
    igCommentId: "c-en",
  };

  const result = await runReplyHarness({
    context,
    agentContent: defaultAgentContent(),
    llm,
  });

  assert.equal(result.terminalStatus, "barrier_reply");
  assert.equal(calls, 2);
  assert.doesNotMatch(result.finalText ?? "", /188/);
  assert.match(result.finalText ?? "", /local emergency|crisis hotline/i);
});

test("runReplyHarness rejects barrier when LLM never meets checklist (no canned fallback)", async () => {
  let calls = 0;
  const llm: LlmCompleter = {
    async complete() {
      calls += 1;
      if (calls === 1) {
        return createTestLlmCompletion(
          JSON.stringify({
            shouldReply: false,
            replyTier: "none",
            blockCategory: "crisis",
            reason: "crisis",
            reasoning: "risk",
          }),
        );
      }
      return createTestLlmCompletion(
        JSON.stringify({
          finalText: "Fica bem!",
          reasoning: "too soft",
        }),
      );
    },
  };

  const context = mockContext();
  context.targetComment = {
    authorUsername: "vera",
    text: "Quero morrer",
    igCommentId: "c-fallback",
  };

  const result = await runReplyHarness({
    context,
    agentContent: defaultAgentContent(),
    llm,
  });

  assert.equal(result.terminalStatus, "rejected_verify");
  assert.equal(result.finalText, null);
  assert.equal(calls, 3);
  assert.match(result.steps[1]?.reason ?? "", /barrier_incomplete:crisis/);
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
