export type LlmUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type LlmCompletionResult = {
  text: string;
  model: string;
  usage: LlmUsage | null;
  latencyMs: number;
};

export type LlmCompleter = {
  complete(prompt: string): Promise<LlmCompletionResult>;
};

export function createTestLlmCompletion(
  text: string,
  overrides: Partial<LlmCompletionResult> = {},
): LlmCompletionResult {
  return {
    text,
    model: overrides.model ?? "test-model",
    usage:
      overrides.usage ??
      ({
        promptTokens: 100,
        completionTokens: Math.max(1, Math.ceil(text.length / 4)),
        totalTokens: 100 + Math.max(1, Math.ceil(text.length / 4)),
      } satisfies LlmUsage),
    latencyMs: overrides.latencyMs ?? 1,
  };
}
