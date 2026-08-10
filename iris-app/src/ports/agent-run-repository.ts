export type AgentRunStatus = "ok" | "failed" | "skipped";

export type AgentRun = {
  id: string;
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
};

export type AgentRunRepository = {
  create(input: CreateAgentRunInput): AgentRun;
  findById(id: string): AgentRun | null;
};
