import type { ReplyTier } from "./reply-tier.ts";

export type HarnessStageName = "triage" | "draft" | "verify";

export type HarnessVerdict = "pass" | "fail" | "skip";

export type HarnessTerminalStatus =
  | "skipped_triage"
  | "rejected_verify"
  | "approved"
  | "approved_simple";

export type StageResult = {
  stage: HarnessStageName;
  verdict: HarnessVerdict;
  reason: string;
  reasoning: string;
  replyTier?: ReplyTier;
  draftText?: string;
  finalText?: string;
};

export type HarnessRunResult = {
  terminalStatus: HarnessTerminalStatus;
  replyTier: ReplyTier | null;
  steps: StageResult[];
  finalText: string | null;
};

export type VerifyStageOutput = {
  approved: boolean;
  reason: string;
  reasoning: string;
  finalText?: string;
};
