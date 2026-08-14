import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { summarizeHarnessSession } from "./summarize-harness-session.ts";
import type { AgentRunStep } from "../../ports/agent-run-step-repository.ts";

function step(partial: Partial<AgentRunStep>): AgentRunStep {
  return {
    id: "s1",
    agentRunId: "r1",
    commentId: null,
    messageId: null,
    stage: "message_draft_turn",
    stepKind: "llm",
    turnIndex: 0,
    toolName: null,
    toolInputJson: null,
    toolOutputJson: null,
    toolLatencyMs: null,
    parentStepId: null,
    verdict: "pass",
    reason: null,
    reasoning: null,
    outputJson: null,
    llm: {
      model: "gpt-test",
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
      latencyMs: 100,
    },
    createdAt: "2026-08-14T10:00:00.000Z",
    ...partial,
  };
}

describe("summarizeHarnessSession", () => {
  test("aggregates llm and tool metrics", () => {
    const summary = summarizeHarnessSession(
      [
        step({}),
        step({
          id: "s2",
          stage: "tool_call",
          stepKind: "tool",
          llm: null,
          toolName: "search_products",
          toolLatencyMs: 40,
        }),
      ],
      "2026-08-14T10:00:00.000Z",
      "2026-08-14T10:00:02.000Z",
    );

    assert.equal(summary.stepCount, 2);
    assert.equal(summary.llmCallCount, 1);
    assert.equal(summary.toolCallCount, 1);
    assert.equal(summary.totalPromptTokens, 10);
    assert.equal(summary.totalLatencyMs, 140);
    assert.equal(summary.durationMs, 2000);
    assert.deepEqual(summary.models, ["gpt-test"]);
  });
});
