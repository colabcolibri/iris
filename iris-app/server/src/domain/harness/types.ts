export type HarnessStepKind = "llm" | "tool" | "system";

export type HarnessSessionSummary = {
  stepCount: number;
  llmCallCount: number;
  toolCallCount: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalLatencyMs: number;
  durationMs: number | null;
  models: string[];
};

export type HarnessBudget = {
  maxTurns: number;
  maxToolCalls: number;
  timeoutMs: number;
  maxCatalogResults: number;
  maxRefreshPerSession: number;
};

export const DEFAULT_HARNESS_BUDGET: HarnessBudget = {
  maxTurns: 5,
  maxToolCalls: 8,
  timeoutMs: 45_000,
  maxCatalogResults: 10,
  maxRefreshPerSession: 2,
};

export type AgentLoopTurnAction =
  | { action: "call_tool"; tool: string; arguments: Record<string, unknown> }
  | { action: "finish"; text: string };

export type AgentLoopTerminalStatus =
  | "finished"
  | "budget_exceeded"
  | "timeout"
  | "invalid_response"
  | "tool_error";

export type AgentLoopStepResult = {
  stage:
    | "message_draft_turn"
    | "tool_call"
    | "tool_result";
  stepKind: HarnessStepKind;
  turnIndex: number;
  verdict: "pass" | "fail" | "skip";
  reason: string;
  reasoning: string;
  toolName?: string;
  toolInput?: Record<string, unknown> | null;
  toolOutput?: unknown;
  toolLatencyMs?: number;
  parentStepId?: string | null;
  llm?: import("../reply-harness/types.ts").StageLlmTelemetry;
};

export type AgentLoopRunResult = {
  terminalStatus: AgentLoopTerminalStatus;
  finalText: string | null;
  steps: AgentLoopStepResult[];
  resolvedProducts: import("../products/resolved-product-view.ts").ResolvedProductView[];
};
