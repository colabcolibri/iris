import type { StageResult } from "../domain/reply-harness/types.ts";

export type HarnessStepRecorder = {
  recordStep(input: {
    agentRunId: string;
    commentId: string;
    step: StageResult;
  }): void;
};

export function createHarnessStepRecorder(
  append: (steps: Array<{
    agentRunId: string;
    commentId: string;
    stage: StageResult["stage"];
    verdict: StageResult["verdict"];
    reason?: string | null;
    reasoning?: string | null;
  }>) => void,
): HarnessStepRecorder {
  return {
    recordStep({ agentRunId, commentId, step }) {
      append([
        {
          agentRunId,
          commentId,
          stage: step.stage,
          verdict: step.verdict,
          reason: step.reason,
          reasoning: step.reasoning,
        },
      ]);
    },
  };
}
