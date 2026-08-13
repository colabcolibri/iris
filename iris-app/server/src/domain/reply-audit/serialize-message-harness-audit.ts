import type { MessageHarnessRunResult } from "../message-harness/types.ts";
import { mapStageResultToAuditStep } from "./audit-step-view.ts";

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
    steps: result.steps.map((step) =>
      mapStageResultToAuditStep({
        stage: step.stage,
        verdict: step.verdict,
        reason: step.reason,
        reasoning: step.reasoning,
        structured: step.structured ?? {
          ...(step.messageCategory ? { messageCategory: step.messageCategory } : {}),
          ...(step.productSlug ? { product_slug: step.productSlug } : {}),
        },
        llm: step.llm,
      }),
    ),
  };
}
