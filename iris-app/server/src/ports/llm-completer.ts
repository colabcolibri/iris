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
  /** Where this call comes from. The provider is not called without it. */
  source: string;
};

export class LlmCompletionError extends Error {
  readonly model: string | null;
  readonly usage: LlmUsage | null;
  readonly latencyMs: number;

  constructor(
    message: string,
    details: { model: string | null; usage: LlmUsage | null; latencyMs: number },
  ) {
    super(message);
    this.name = "LlmCompletionError";
    this.model = details.model;
    this.usage = details.usage;
    this.latencyMs = details.latencyMs;
  }
}

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
