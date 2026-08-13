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
  return {
    agentRunId: runId,
    messageId: messageId ?? null,
    stage: step.stage,
    verdict: step.verdict,
    reason: step.reason,
    reasoning: step.reasoning,
    outputJson: step.structured ?? null,
    llm: step.llm ?? null,
  };
}

export async function executeAndRecordMessageHarness(
  repos: MessageHarnessRunRepos,
  input: ExecuteAndRecordMessageHarnessInput,
): Promise<ExecuteAndRecordMessageHarnessResult> {
  const flowId = input.flowId ?? randomUUID();
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

    const updatedRun = repos.agentRuns.updateOutcome(run.id, {
      outputSummary: harness.finalText?.slice(0, 500) ?? harness.terminalStatus,
      status: runStatusFromMessageHarnessTerminal(harness.terminalStatus),
    });

    return { harness, run: updatedRun, flowId };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message.slice(0, 500) : "message harness failed";
    const failedRun = repos.agentRuns.updateOutcome(run.id, {
      outputSummary: errorMessage,
      status: "failed",
    });
    throw new MessageHarnessExecutionError(errorMessage, failedRun, flowId);
  }
}
