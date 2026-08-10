import type { AgentRunStep } from "../../ports/agent-run-step-repository.ts";
import type { AgentDecisionJson } from "../reply-harness/decision-json.ts";
import type { StageLlmTelemetry, StageResult } from "../reply-harness/types.ts";

export type AuditStepView = {
  stage: StageResult["stage"];
  verdict: StageResult["verdict"];
  reason: string | null;
  reasoning: string | null;
  created_at: string;
  structured: AgentDecisionJson | null;
  llm: StageLlmTelemetry | null;
};

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

export function mapAgentRunStepToAuditStep(step: AgentRunStep): AuditStepView {
  return {
    stage: step.stage,
    verdict: step.verdict,
    reason: step.reason,
    reasoning: step.reasoning,
    created_at: step.createdAt,
    structured: parseStructured(step.outputJson),
    llm: step.llm,
  };
}

export function mapStageResultToAuditStep(step: StageResult): AuditStepView {
  return {
    stage: step.stage,
    verdict: step.verdict,
    reason: step.reason,
    reasoning: step.reasoning,
    created_at: new Date().toISOString(),
    structured: step.structured ?? null,
    llm: step.llm ?? null,
  };
}
