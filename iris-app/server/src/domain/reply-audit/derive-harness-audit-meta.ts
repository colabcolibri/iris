import type { AgentRunStatus } from "../../ports/agent-run-repository.ts";
import type { AgentRunStep } from "../../ports/agent-run-step-repository.ts";
import type { AgentDecisionJson } from "../reply-harness/decision-json.ts";
import type { HarnessTerminalStatus } from "../reply-harness/types.ts";
import type { ReplyTier } from "../reply-harness/reply-tier.ts";

export type HarnessAuditSignals = {
  status: AgentRunStatus;
  outputSummary: string | null;
  triageReason?: string | null;
  triageOutputJson?: string | null;
  steps?: AgentRunStep[];
};

export type HarnessAuditMeta = {
  terminalStatus: HarnessTerminalStatus | null;
  replyTier: ReplyTier | null;
};

function parseStructured(outputJson: string | null | undefined): AgentDecisionJson | null {
  if (!outputJson) {
    return null;
  }
  try {
    return JSON.parse(outputJson) as AgentDecisionJson;
  } catch {
    return null;
  }
}

function replyTierFromReason(reason: string | null | undefined): ReplyTier | null {
  if (reason?.includes("tier:simple")) {
    return "simple";
  }
  if (reason?.includes("tier:full")) {
    return "full";
  }
  if (reason?.includes("tier:none")) {
    return "none";
  }
  return null;
}

function replyTierFromSteps(steps: AgentRunStep[]): ReplyTier | null {
  for (const step of steps) {
    const structured = parseStructured(step.outputJson);
    if (structured && "replyTier" in structured) {
      return structured.replyTier;
    }
    const fromReason = replyTierFromReason(step.reason);
    if (fromReason) {
      return fromReason;
    }
  }
  return null;
}

function replyTierFromTriageJson(triageOutputJson: string | null | undefined): ReplyTier | null {
  if (!triageOutputJson) {
    return null;
  }
  const structured = parseStructured(triageOutputJson);
  if (structured && "replyTier" in structured) {
    return structured.replyTier;
  }
  return null;
}

export function deriveHarnessReplyTier(signals: HarnessAuditSignals): ReplyTier | null {
  if (signals.steps?.length) {
    return replyTierFromSteps(signals.steps);
  }

  const fromJson = replyTierFromTriageJson(signals.triageOutputJson);
  if (fromJson) {
    return fromJson;
  }

  return replyTierFromReason(signals.triageReason);
}

export function deriveHarnessTerminalStatus(
  signals: HarnessAuditSignals,
  replyTier: ReplyTier | null,
): HarnessTerminalStatus | null {
  const summary = signals.outputSummary ?? "";

  if (
    summary === "blocked_harmful" ||
    summary === "skipped_triage" ||
    summary === "rejected_verify" ||
    summary === "approved_simple" ||
    summary === "approved"
  ) {
    return summary;
  }

  const triageReason =
    signals.triageReason ?? signals.steps?.find((step) => step.stage === "triage")?.reason;

  if (triageReason?.includes("block:harmful")) {
    return "blocked_harmful";
  }

  if (signals.status === "skipped") {
    return triageReason?.includes("block:harmful") ? "blocked_harmful" : "skipped_triage";
  }

  if (signals.status === "failed") {
    return "rejected_verify";
  }

  if (signals.status === "ok" && replyTier === "simple") {
    return "approved_simple";
  }

  if (signals.status === "ok") {
    return "approved";
  }

  return null;
}

export function deriveHarnessAuditMeta(signals: HarnessAuditSignals): HarnessAuditMeta {
  const replyTier = deriveHarnessReplyTier(signals);
  return {
    replyTier,
    terminalStatus: deriveHarnessTerminalStatus(signals, replyTier),
  };
}
