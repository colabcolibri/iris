import type { AgentRunStep } from "../../ports/agent-run-step-repository.ts";
import type { AgentDecisionJson } from "../reply-harness/decision-json.ts";
import type { MessageStageResult } from "../message-harness/types.ts";
import type { StageLlmTelemetry, StageResult } from "../reply-harness/types.ts";
import { parseToolJson } from "../harness/sanitize-tool-json.ts";

export type AuditStepView = {
  stage: StageResult["stage"];
  verdict: StageResult["verdict"];
  reason: string | null;
  reasoning: string | null;
  created_at: string;
  step_kind: string | null;
  turn_index: number | null;
  tool_name: string | null;
  tool_input: Record<string, unknown> | null;
  tool_output: unknown;
  tool_latency_ms: number | null;
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
    step_kind: step.stepKind,
    turn_index: step.turnIndex,
    tool_name: step.toolName,
    tool_input: parseToolJson<Record<string, unknown>>(step.toolInputJson),
    tool_output: parseToolJson(step.toolOutputJson),
    tool_latency_ms: step.toolLatencyMs,
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
    step_kind: step.llm ? "llm" : null,
    turn_index: null,
    tool_name: null,
    tool_input: null,
    tool_output: null,
    tool_latency_ms: null,
    structured: step.structured ?? null,
    llm: step.llm ?? null,
  };
}

function readStructuredToolFields(structured: Record<string, unknown> | undefined) {
  const toolName =
    structured && typeof structured.toolName === "string" ? structured.toolName : null;
  const turnIndex =
    structured && typeof structured.turnIndex === "number" ? structured.turnIndex : null;
  const toolInput =
    structured && structured.toolInput && typeof structured.toolInput === "object"
      ? (structured.toolInput as Record<string, unknown>)
      : null;
  const toolOutput = structured?.toolOutput;

  return { toolName, turnIndex, toolInput, toolOutput };
}

export function mapMessageStageResultToAuditStep(step: MessageStageResult): AuditStepView {
  const structured = step.structured as Record<string, unknown> | undefined;
  const { toolName, turnIndex, toolInput, toolOutput } = readStructuredToolFields(structured);

  return {
    stage: step.stage,
    verdict: step.verdict,
    reason: step.reason,
    reasoning: step.reasoning,
    created_at: new Date().toISOString(),
    step_kind: toolName ? "tool" : step.llm ? "llm" : null,
    turn_index: turnIndex,
    tool_name: toolName,
    tool_input: toolInput,
    tool_output: toolOutput,
    tool_latency_ms: null,
    structured: (step.structured as AgentDecisionJson | undefined) ?? null,
    llm: step.llm ?? null,
  };
}
