import type { LlmCompletionResult } from "../../ports/llm-completer.ts";
import type { StageLlmTelemetry } from "./types.ts";

export function stageLlmFromCompletion(completion: LlmCompletionResult): StageLlmTelemetry {
  return {
    model: completion.model,
    promptTokens: completion.usage?.promptTokens ?? null,
    completionTokens: completion.usage?.completionTokens ?? null,
    totalTokens: completion.usage?.totalTokens ?? null,
    latencyMs: completion.latencyMs,
  };
}
