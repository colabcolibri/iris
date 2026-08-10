import type { AgentRun, AgentRunStatus } from "../../ports/agent-run-repository.ts";
import type { AgentRunStep } from "../../ports/agent-run-step-repository.ts";
import type { AgentDecisionJson } from "../reply-harness/decision-json.ts";
import type { HarnessTerminalStatus } from "../reply-harness/types.ts";
import type { ReplyTier } from "../reply-harness/reply-tier.ts";

function parseStructured(outputJson: string | null): AgentDecisionJson | null {
  if (!outputJson) {
    return null;
  }
  try {
    return JSON.parse(outputJson) as AgentDecisionJson;
  } catch {
    return null;
  }
}

function replyTierFromSteps(steps: AgentRunStep[]): ReplyTier | null {
  for (const step of steps) {
    const structured = parseStructured(step.outputJson);
    if (structured && "replyTier" in structured) {
      return structured.replyTier;
    }
    if (step.reason?.includes("tier:simple")) {
      return "simple";
    }
    if (step.reason?.includes("tier:full")) {
      return "full";
    }
    if (step.reason?.includes("tier:none")) {
      return "none";
    }
  }
  return null;
}

export function terminalStatusFromRun(
  run: AgentRun,
  steps: AgentRunStep[],
): HarnessTerminalStatus {
  const summary = run.outputSummary ?? "";

  if (summary === "blocked_harmful") {
    return "blocked_harmful";
  }
  if (summary === "skipped_triage" || summary.startsWith("block:")) {
    return "skipped_triage";
  }
  if (summary === "rejected_verify") {
    return "rejected_verify";
  }
  if (summary === "approved_simple") {
    return "approved_simple";
  }
  if (summary === "approved") {
    return "approved";
  }

  const triage = steps.find((step) => step.stage === "triage");
  if (triage?.reason?.includes("block:harmful")) {
    return "blocked_harmful";
  }

  if (run.status === "skipped") {
    return triage?.reason?.includes("block:harmful") ? "blocked_harmful" : "skipped_triage";
  }

  if (run.status === "failed") {
    return "rejected_verify";
  }

  const tier = replyTierFromSteps(steps);
  if (run.status === "ok" && tier === "simple") {
    return "approved_simple";
  }

  return "approved";
}

export function terminalStatusFromRunStatus(status: AgentRunStatus): HarnessTerminalStatus {
  if (status === "ok") {
    return "approved";
  }
  if (status === "skipped") {
    return "skipped_triage";
  }
  return "rejected_verify";
}

export function serializeReplyAudit(run: AgentRun, steps: AgentRunStep[]) {
  return {
    agent_run_id: run.id,
    trigger: run.trigger,
    terminal_status: terminalStatusFromRun(run, steps),
    reply_tier: replyTierFromSteps(steps),
    output_summary: run.outputSummary,
    steps: steps.map((step) => ({
      stage: step.stage,
      verdict: step.verdict,
      reason: step.reason,
      reasoning: step.reasoning,
      created_at: step.createdAt,
      structured: parseStructured(step.outputJson),
    })),
  };
}
