import type { LlmCallLog } from "../../ports/llm-call-log.ts";
import {
  LlmCompletionError,
  type LlmCompleter,
  type LlmCompleteOptions,
} from "../../ports/llm-completer.ts";

const ERROR_MESSAGE_LIMIT = 500;

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "LLM request failed";
  return message.slice(0, ERROR_MESSAGE_LIMIT);
}

function sourceOf(options: LlmCompleteOptions | undefined): string {
  const source = options?.source?.trim() ?? "";
  if (!source) {
    throw new Error("LLM call missing source");
  }
  return source;
}

export function withLlmCallLog(inner: LlmCompleter, log: LlmCallLog): LlmCompleter {
  return {
    async complete(prompt, options) {
      const source = sourceOf(options);
      const startedAt = Date.now();
      try {
        const result = await inner.complete(prompt, options);
        log.record({
          model: result.model,
          source,
          status: "ok",
          promptTokens: result.usage?.promptTokens ?? null,
          completionTokens: result.usage?.completionTokens ?? null,
          totalTokens: result.usage?.totalTokens ?? null,
          latencyMs: result.latencyMs,
          errorMessage: null,
        });
        return result;
      } catch (error) {
        const failed = error instanceof LlmCompletionError ? error : null;
        log.record({
          model: failed?.model ?? null,
          source,
          status: "error",
          promptTokens: failed?.usage?.promptTokens ?? null,
          completionTokens: failed?.usage?.completionTokens ?? null,
          totalTokens: failed?.usage?.totalTokens ?? null,
          latencyMs: failed?.latencyMs ?? Date.now() - startedAt,
          errorMessage: errorMessage(error),
        });
        throw error;
      }
    },
  };
}
