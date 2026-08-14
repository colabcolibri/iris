import type { AgentRunStep } from "../../ports/agent-run-step-repository.ts";
import type { HarnessSessionSummary } from "./types.ts";

export function summarizeHarnessSession(
  steps: AgentRunStep[],
  startedAt: string | null,
  endedAt: string | null,
): HarnessSessionSummary {
  let llmCallCount = 0;
  let toolCallCount = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalLatencyMs = 0;
  const models = new Set<string>();

  for (const step of steps) {
    if (step.stepKind === "tool" && step.stage === "tool_call") {
      toolCallCount += 1;
      totalLatencyMs += step.toolLatencyMs ?? 0;
    }

    if (step.stepKind === "llm" && step.llm) {
      llmCallCount += 1;
      totalPromptTokens += step.llm.promptTokens ?? 0;
      totalCompletionTokens += step.llm.completionTokens ?? 0;
      totalTokens += step.llm.totalTokens ?? 0;
      totalLatencyMs += step.llm.latencyMs ?? 0;
      if (step.llm.model) {
        models.add(step.llm.model);
      }
    }
  }

  let durationMs: number | null = null;
  if (startedAt && endedAt) {
    const start = Date.parse(startedAt);
    const end = Date.parse(endedAt);
    if (!Number.isNaN(start) && !Number.isNaN(end)) {
      durationMs = Math.max(0, end - start);
    }
  }

  return {
    stepCount: steps.length,
    llmCallCount,
    toolCallCount,
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
    totalLatencyMs,
    durationMs,
    models: [...models],
  };
}
