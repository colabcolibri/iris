import type { BlockCategory, ReplyTier } from "./reply-tier.ts";

export type TriageDecisionJson = {
  shouldReply: boolean;
  replyTier: ReplyTier;
  blockCategory: BlockCategory;
  reason: string;
  reasoning: string;
};

export type DraftDecisionJson = {
  replyTier: ReplyTier;
  contextSummary: string;
  draftPreview: string;
};

export type VerifyDecisionJson = {
  approved: boolean;
  harmful: boolean;
  policyViolations: string[];
  reason: string;
  reasoning: string;
  finalText?: string;
};

export type AgentDecisionJson = TriageDecisionJson | DraftDecisionJson | VerifyDecisionJson;
