import type { HarnessStageName, HarnessVerdict } from "../domain/reply-harness/types.ts";

export type AgentRunStep = {
  id: string;
  agentRunId: string;
  commentId: string;
  stage: HarnessStageName;
  verdict: HarnessVerdict;
  reason: string | null;
  reasoning: string | null;
  createdAt: string;
};

export type CreateAgentRunStepInput = {
  agentRunId: string;
  commentId: string;
  stage: HarnessStageName;
  verdict: HarnessVerdict;
  reason?: string | null;
  reasoning?: string | null;
};

export type AgentRunStepRepository = {
  appendBatch(steps: CreateAgentRunStepInput[]): AgentRunStep[];
  listByCommentId(commentId: string): AgentRunStep[];
  findLatestRunIdByCommentId(commentId: string): string | null;
};
