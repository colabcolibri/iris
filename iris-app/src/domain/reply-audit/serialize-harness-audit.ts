import type { HarnessRunResult } from "../reply-harness/types.ts";

export function serializeHarnessAudit(result: HarnessRunResult, trigger = "simulate") {
  return {
    agent_run_id: "simulate",
    trigger,
    terminal_status: result.terminalStatus,
    reply_tier: result.replyTier,
    output_summary: result.finalText,
    steps: result.steps.map((step) => ({
      stage: step.stage,
      verdict: step.verdict,
      reason: step.reason,
      reasoning: step.reasoning,
      created_at: new Date().toISOString(),
      structured: step.structured ?? null,
    })),
  };
}
