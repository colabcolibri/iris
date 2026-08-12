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
import { runReplyHarness, type RunReplyHarnessInput } from "./orchestrator.ts";
import type { HarnessRunResult, StageResult } from "./types.ts";

export function runStatusFromHarnessTerminal(terminalStatus: string): AgentRunStatus {
  if (
    terminalStatus === "approved" ||
    terminalStatus === "approved_simple" ||
    terminalStatus === "barrier_reply"
  ) {
    return "ok";
  }
  if (terminalStatus === "skipped_triage" || terminalStatus === "blocked_harmful") {
    return "skipped";
  }
  return "failed";
}

export class HarnessExecutionError extends Error {
  readonly run: AgentRun;
  readonly flowId: string;

  constructor(message: string, run: AgentRun, flowId: string) {
    super(message);
    this.name = "HarnessExecutionError";
    this.run = run;
    this.flowId = flowId;
  }
}

export type HarnessRunRepos = {
  agentRuns: AgentRunRepository;
  agentRunSteps: AgentRunStepRepository;
};

export type ExecuteAndRecordHarnessInput = {
  trigger: string;
  commentId?: string | null;
  flowId?: string;
  inputSummary?: string | null;
  harnessInput: Omit<RunReplyHarnessInput, "onStepComplete">;
};

export type ExecuteAndRecordHarnessResult = {
  harness: HarnessRunResult;
  run: AgentRun;
  flowId: string;
};

export type RecordFailedHarnessRunInput = {
  trigger: string;
  commentId?: string | null;
  flowId?: string;
  inputSummary?: string | null;
  errorMessage: string;
};

export type RecordFailedHarnessRunResult = {
  run: AgentRun;
  flowId: string;
};

function mapStageToStepInput(
  runId: string,
  commentId: string | null | undefined,
  step: StageResult,
): CreateAgentRunStepInput {
  return {
    agentRunId: runId,
    commentId: commentId ?? null,
    stage: step.stage,
    verdict: step.verdict,
    reason: step.reason,
    reasoning: step.reasoning,
    outputJson: step.structured ?? null,
    llm: step.llm ?? null,
  };
}

export function recordFailedHarnessRun(
  repos: Pick<HarnessRunRepos, "agentRuns">,
  input: RecordFailedHarnessRunInput,
): RecordFailedHarnessRunResult {
  const flowId = input.flowId ?? randomUUID();
  const run = repos.agentRuns.create({
    trigger: input.trigger,
    inputSummary: input.inputSummary,
    outputSummary: input.errorMessage.slice(0, 500),
    status: "failed",
    flowId,
  });

  return { run, flowId };
}

export async function executeAndRecordHarness(
  repos: HarnessRunRepos,
  input: ExecuteAndRecordHarnessInput,
): Promise<ExecuteAndRecordHarnessResult> {
  const flowId = input.flowId ?? randomUUID();
  const run = repos.agentRuns.create({
    trigger: input.trigger,
    inputSummary: input.inputSummary,
    outputSummary: "in_progress",
    status: "ok",
    flowId,
  });

  try {
    const harness = await runReplyHarness({
      ...input.harnessInput,
      onStepComplete: async (step) => {
        repos.agentRunSteps.appendBatch([
          mapStageToStepInput(run.id, input.commentId, step),
        ]);
      },
    });

    const updatedRun = repos.agentRuns.updateOutcome(run.id, {
      outputSummary: harness.finalText?.slice(0, 500) ?? harness.terminalStatus,
      status: runStatusFromHarnessTerminal(harness.terminalStatus),
    });

    return { harness, run: updatedRun, flowId };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message.slice(0, 500) : "harness failed";
    const failedRun = repos.agentRuns.updateOutcome(run.id, {
      outputSummary: errorMessage,
      status: "failed",
    });
    throw new HarnessExecutionError(errorMessage, failedRun, flowId);
  }
}
