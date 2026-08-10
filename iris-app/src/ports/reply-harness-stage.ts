import type { StageResult } from "../domain/reply-harness/types.ts";

export type ReplyHarnessStageInput = {
  prompt: string;
};

export type ReplyHarnessStage = {
  run(input: ReplyHarnessStageInput): Promise<StageResult>;
};
