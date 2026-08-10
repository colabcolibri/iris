import type { AgentRun } from "../../ports/agent-run-repository.ts";
import type { AgentRunStep } from "../../ports/agent-run-step-repository.ts";
import { mapAgentRunStepToAuditStep } from "./audit-step-view.ts";
import { deriveHarnessAuditMeta } from "./derive-harness-audit-meta.ts";

export function serializeReplyAudit(run: AgentRun, steps: AgentRunStep[]) {
  const meta = deriveHarnessAuditMeta({
    status: run.status,
    outputSummary: run.outputSummary,
    steps,
  });

  return {
    agent_run_id: run.id,
    flow_id: run.flowId,
    trigger: run.trigger,
    terminal_status: meta.terminalStatus,
    reply_tier: meta.replyTier,
    output_summary: run.outputSummary,
    steps: steps.map(mapAgentRunStepToAuditStep),
  };
}
