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

export type LlmImageInput = {
  mime: string;
  base64: string;
};

export type LlmCompleteOptions = {
  images?: LlmImageInput[];
  /** Default completer cap is 2200; carousel summaries may request more. */
  maxOutputChars?: number;
};

export type LlmCompleter = {
  complete(prompt: string, options?: LlmCompleteOptions): Promise<LlmCompletionResult>;
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
