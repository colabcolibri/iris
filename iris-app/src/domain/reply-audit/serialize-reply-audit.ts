import type { AgentRun, AgentRunStatus } from "../../ports/agent-run-repository.ts";
import type { AgentRunStep } from "../../ports/agent-run-step-repository.ts";
import type { HarnessTerminalStatus } from "../reply-harness/types.ts";

export function terminalStatusFromRun(status: AgentRunStatus): HarnessTerminalStatus {
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
    terminal_status: terminalStatusFromRun(run.status),
    output_summary: run.outputSummary,
    steps: steps.map((step) => ({
      stage: step.stage,
      verdict: step.verdict,
      reason: step.reason,
      reasoning: step.reasoning,
      created_at: step.createdAt,
    })),
  };
}
