import type { AgentDecisionJson } from "../reply-harness/decision-json.ts";
import type {
  HarnessVerdict,
  MessageHarnessStageName,
  StageLlmTelemetry,
  VerifyStageOutput,
} from "../reply-harness/types.ts";
import type { MessageCategory } from "./message-category.ts";
import type { SupportIntent, SupportUrgency } from "./support-intent.ts";

export type MessageHarnessTerminalStatus =
  | "blocked_harmful"
  | "draft_failed"
  | "budget_exceeded"
  | "escalated_operator"
  | "rejected_verify"
  | "approved";

export type MessageStageResult = {
  stage: MessageHarnessStageName;
  verdict: HarnessVerdict;
  reason: string;
  reasoning: string;
  messageCategory?: MessageCategory;
  productSlug?: string | null;
  draftText?: string;
  finalText?: string;
  structured?: AgentDecisionJson;
  llm?: StageLlmTelemetry;
};

export type MessageHarnessRunResult = {
  terminalStatus: MessageHarnessTerminalStatus;
  messageCategory: MessageCategory | null;
  steps: MessageStageResult[];
  finalText: string | null;
};

export type MessageTriageStageOutput = {
  messageCategory?: string;
  productSlug?: string | null;
  shouldReply?: boolean;
  reason?: string;
  reasoning?: string;
  supportIntent?: string;
  supportUrgency?: string;
};

export type MessageVerifyStageOutput = VerifyStageOutput;
