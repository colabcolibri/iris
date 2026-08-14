import type {
  HarnessStageName,
  HarnessStepKind,
  HarnessVerdict,
  MessageHarnessStageName,
  StageLlmTelemetry,
} from "../domain/reply-harness/types.ts";
import type { AgentDecisionJson } from "../domain/reply-harness/decision-json.ts";
import type { HarnessSessionSummary } from "../domain/harness/types.ts";

export type AgentRunStep = {
  id: string;
  agentRunId: string;
  commentId: string | null;
  messageId: string | null;
  stage: HarnessStageName;
  stepKind: HarnessStepKind | null;
  turnIndex: number | null;
  toolName: string | null;
  toolInputJson: string | null;
  toolOutputJson: string | null;
  toolLatencyMs: number | null;
  parentStepId: string | null;
  verdict: HarnessVerdict;
  reason: string | null;
  reasoning: string | null;
  outputJson: string | null;
  llmContextJson: string | null;
  llm: StageLlmTelemetry | null;
  createdAt: string;
};

export type CreateAgentRunStepInput = {
  agentRunId: string;
  commentId?: string | null;
  messageId?: string | null;
  stage: HarnessStageName;
  stepKind?: HarnessStepKind | null;
  turnIndex?: number | null;
  toolName?: string | null;
  toolInput?: Record<string, unknown> | null;
  toolOutput?: unknown;
  toolLatencyMs?: number | null;
  parentStepId?: string | null;
  verdict: HarnessVerdict;
  reason?: string | null;
  reasoning?: string | null;
  outputJson?: AgentDecisionJson | null;
  llmContextJson?: string | null;
  llm?: StageLlmTelemetry | null;
};

export type AgentRunStepRepository = {
  appendBatch(steps: CreateAgentRunStepInput[]): AgentRunStep[];
  listByCommentId(commentId: string): AgentRunStep[];
  listByMessageId(messageId: string): AgentRunStep[];
  listByAgentRunId(agentRunId: string): AgentRunStep[];
  findLatestRunIdByCommentId(commentId: string): string | null;
  findLatestRunIdByMessageId(messageId: string): string | null;
};
