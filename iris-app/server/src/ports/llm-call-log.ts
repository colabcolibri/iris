export type LlmCallStatus = "ok" | "error";

export type RecordLlmCallInput = {
  model: string | null;
  source: string;
  status: LlmCallStatus;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  latencyMs: number | null;
  errorMessage: string | null;
};

export type LlmCallLog = {
  record(input: RecordLlmCallInput): void;
};
