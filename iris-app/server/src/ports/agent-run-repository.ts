export type AgentRunStatus = "ok" | "failed" | "skipped";

export type AgentRun = {
  id: string;
  flowId: string;
  trigger: string;
  inputSummary: string | null;
  outputSummary: string | null;
  status: AgentRunStatus;
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
};

export type AgentRunListItem = {
  id: string;
  flowId: string;
  trigger: string;
  status: AgentRunStatus;
  outputSummary: string | null;
  createdAt: string;
  commentId: string | null;
  postId: string | null;
  stepCount: number;
  replyTier: string | null;
  terminalStatus: string | null;
  durationMs: number | null;
  totalPromptTokens: number | null;
  totalCompletionTokens: number | null;
  totalTokens: number | null;
  models: string[];
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
