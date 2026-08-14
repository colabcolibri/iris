import type { MessageHarnessRunResult } from "../message-harness/types.ts";
import { mapMessageStageResultToAuditStep } from "./audit-step-view.ts";

export function serializeMessageHarnessAudit(
  result: MessageHarnessRunResult,
  trigger = "simulate",
  agentRunId = "simulate",
  flowId = agentRunId,
) {
  return {
    agent_run_id: agentRunId,
    flow_id: flowId,
    trigger,
    terminal_status: result.terminalStatus,
    reply_tier: result.finalText ? "full" : "none",
    output_summary: result.finalText,
    message_category: result.messageCategory,
    steps: result.steps.map((step) => mapMessageStageResultToAuditStep(step)),
  };
}
