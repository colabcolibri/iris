import type { AgentDecisionJson } from "./decision-json.ts";
import type { BlockCategory, ReplyTier } from "./reply-tier.ts";

export type HarnessStageName = "triage" | "draft" | "verify";

export type HarnessVerdict = "pass" | "fail" | "skip";

export type StageLlmTelemetry = {
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  latencyMs: number;
};

export type HarnessTerminalStatus =
  | "skipped_triage"
  | "blocked_harmful"
  | "rejected_verify"
  | "approved"
  | "approved_simple";

export type StageResult = {
  stage: HarnessStageName;
  verdict: HarnessVerdict;
  reason: string;
  reasoning: string;
  replyTier?: ReplyTier;
  blockCategory?: BlockCategory;
  contextSummary?: string;
  draftText?: string;
  finalText?: string;
  structured?: AgentDecisionJson;
  llm?: StageLlmTelemetry;
};

export type HarnessRunResult = {
  terminalStatus: HarnessTerminalStatus;
  replyTier: ReplyTier | null;
  steps: StageResult[];
  finalText: string | null;
};

export type VerifyStageOutput = {
  approved: boolean;
  harmful?: boolean;
  policyViolations?: string[];
  reason: string;
  reasoning: string;
  finalText?: string;
};
