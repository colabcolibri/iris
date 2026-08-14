import type { HarnessSessionSummary } from "../domain/harness/types.ts";

export type AgentRunStatus = "ok" | "failed" | "skipped";

export type AgentRun = {
  id: string;
  flowId: string;
  trigger: string;
  inputSummary: string | null;
  outputSummary: string | null;
  status: AgentRunStatus;
  startedAt: string | null;
  endedAt: string | null;
  sessionSummary: HarnessSessionSummary | null;
  createdAt: string;
};

export type CreateAgentRunInput = {
  trigger: string;
  inputSummary?: string | null;
  outputSummary?: string | null;
  status: AgentRunStatus;
  flowId?: string;
};

export type UpdateAgentRunOutcomeInput = {
  outputSummary: string | null;
  status: AgentRunStatus;
  endedAt?: string | null;
  sessionSummary?: HarnessSessionSummary | null;
};

export type AgentRunListItem = {
  id: string;
  flowId: string;
  trigger: string;
  status: AgentRunStatus;
  outputSummary: string | null;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  commentId: string | null;
  postId: string | null;
  stepCount: number;
  llmCallCount: number;
  toolCallCount: number;
  replyTier: string | null;
  terminalStatus: string | null;
  durationMs: number | null;
  totalPromptTokens: number | null;
  totalCompletionTokens: number | null;
  totalTokens: number | null;
  models: string[];
  sessionSummary: HarnessSessionSummary | null;
};

export type ListAgentRunsOptions = {
  limit?: number;
  cursor?: string | null;
  terminalStatus?: string | null;
  replyTier?: string | null;
};

export type AgentRunRepository = {
  create(input: CreateAgentRunInput): AgentRun;
  updateOutcome(id: string, input: UpdateAgentRunOutcomeInput): AgentRun;
  findById(id: string): AgentRun | null;
  listRecent(options?: ListAgentRunsOptions): { items: AgentRunListItem[]; nextCursor: string | null };
};
