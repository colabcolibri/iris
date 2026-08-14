import { randomUUID } from "node:crypto";
import type {
  AgentRun,
  AgentRunRepository,
  AgentRunStatus,
} from "../../ports/agent-run-repository.ts";
import type {
  AgentRunStepRepository,
  CreateAgentRunStepInput,
} from "../../ports/agent-run-step-repository.ts";
import { summarizeHarnessSession } from "../harness/summarize-harness-session.ts";
import { runMessageHarness, type RunMessageHarnessInput } from "./orchestrator.ts";
import type { MessageHarnessRunResult, MessageStageResult } from "./types.ts";

export function runStatusFromMessageHarnessTerminal(
  terminalStatus: string,
): AgentRunStatus {
  if (terminalStatus === "approved") {
    return "ok";
  }
  if (terminalStatus === "blocked_harmful") {
    return "skipped";
  }
  return "failed";
}

export class MessageHarnessExecutionError extends Error {
  readonly run: AgentRun;
  readonly flowId: string;

  constructor(message: string, run: AgentRun, flowId: string) {
    super(message);
    this.name = "MessageHarnessExecutionError";
    this.run = run;
    this.flowId = flowId;
  }
}

export type MessageHarnessRunRepos = {
  agentRuns: AgentRunRepository;
  agentRunSteps: AgentRunStepRepository;
};

export type ExecuteAndRecordMessageHarnessInput = {
  trigger: string;
  messageId?: string | null;
  flowId?: string;
  inputSummary?: string | null;
  harnessInput: Omit<RunMessageHarnessInput, "onStepComplete">;
};

export type ExecuteAndRecordMessageHarnessResult = {
  harness: MessageHarnessRunResult;
  run: AgentRun;
  flowId: string;
};

function mapStageToStepInput(
  runId: string,
  messageId: string | null | undefined,
  step: MessageStageResult,
): CreateAgentRunStepInput {
  const structured = step.structured as Record<string, unknown> | undefined;
  const toolName =
    structured && typeof structured.toolName === "string" ? structured.toolName : null;
  const turnIndex =
    structured && typeof structured.turnIndex === "number" ? structured.turnIndex : null;
  const llmContextJson =
    structured && typeof structured.llmContextJson === "string"
      ? structured.llmContextJson
      : null;

  return {
    agentRunId: runId,
    messageId: messageId ?? null,
    stage: step.stage,
    stepKind: toolName ? "tool" : step.llm ? "llm" : "system",
    turnIndex,
    toolName,
    toolInput:
      structured && structured.toolInput && typeof structured.toolInput === "object"
        ? (structured.toolInput as Record<string, unknown>)
        : null,
    toolOutput: structured?.toolOutput,
    verdict: step.verdict,
    reason: step.reason,
    reasoning: step.reasoning,
    outputJson: step.structured ?? null,
    llmContextJson,
    llm: step.llm ?? null,
  };
}

export async function executeAndRecordMessageHarness(
  repos: MessageHarnessRunRepos,
  input: ExecuteAndRecordMessageHarnessInput,
): Promise<ExecuteAndRecordMessageHarnessResult> {
  const flowId = input.flowId ?? randomUUID();
  const startedAt = new Date().toISOString();
  const run = repos.agentRuns.create({
    trigger: input.trigger,
    inputSummary: input.inputSummary,
    outputSummary: "in_progress",
    status: "ok",
    flowId,
  });

  try {
    const harness = await runMessageHarness({
      ...input.harnessInput,
      onStepComplete: async (step) => {
        repos.agentRunSteps.appendBatch([
          mapStageToStepInput(run.id, input.messageId, step),
        ]);
      },
    });

    const endedAt = new Date().toISOString();
    const steps = repos.agentRunSteps.listByAgentRunId(run.id);
    const sessionSummary = summarizeHarnessSession(steps, run.startedAt ?? startedAt, endedAt);

    const updatedRun = repos.agentRuns.updateOutcome(run.id, {
      outputSummary: harness.finalText?.slice(0, 500) ?? harness.terminalStatus,
      status: runStatusFromMessageHarnessTerminal(harness.terminalStatus),
      endedAt,
      sessionSummary,
    });

    return { harness, run: updatedRun, flowId };
  } catch (error) {
    const endedAt = new Date().toISOString();
    const errorMessage =
      error instanceof Error ? error.message.slice(0, 500) : "message harness failed";
    const steps = repos.agentRunSteps.listByAgentRunId(run.id);
    const sessionSummary = summarizeHarnessSession(steps, run.startedAt ?? startedAt, endedAt);
    const failedRun = repos.agentRuns.updateOutcome(run.id, {
      outputSummary: errorMessage,
      status: "failed",
      endedAt,
      sessionSummary,
    });
    throw new MessageHarnessExecutionError(errorMessage, failedRun, flowId);
  }
}
