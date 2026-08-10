import type { HarnessRunResult } from "../reply-harness/types.ts";
import { mapStageResultToAuditStep } from "./audit-step-view.ts";

export function serializeHarnessAudit(
  result: HarnessRunResult,
  trigger = "simulate",
  agentRunId = "simulate",
  flowId = agentRunId,
) {
  return {
    agent_run_id: agentRunId,
    flow_id: flowId,
    trigger,
    terminal_status: result.terminalStatus,
    reply_tier: result.replyTier,
    output_summary: result.finalText,
    steps: result.steps.map(mapStageResultToAuditStep),
  };
}
