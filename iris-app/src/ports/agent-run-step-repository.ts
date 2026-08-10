import type { HarnessStageName, HarnessVerdict } from "../domain/reply-harness/types.ts";
import type { AgentDecisionJson } from "../domain/reply-harness/decision-json.ts";

export type AgentRunStep = {
  id: string;
  agentRunId: string;
  commentId: string;
  stage: HarnessStageName;
  verdict: HarnessVerdict;
  reason: string | null;
  reasoning: string | null;
  outputJson: string | null;
  createdAt: string;
};

export type CreateAgentRunStepInput = {
  agentRunId: string;
  commentId: string;
  stage: HarnessStageName;
  verdict: HarnessVerdict;
  reason?: string | null;
  reasoning?: string | null;
  outputJson?: AgentDecisionJson | null;
};

export type AgentRunStepRepository = {
  appendBatch(steps: CreateAgentRunStepInput[]): AgentRunStep[];
  listByCommentId(commentId: string): AgentRunStep[];
  listByAgentRunId(agentRunId: string): AgentRunStep[];
  findLatestRunIdByCommentId(commentId: string): string | null;
};
