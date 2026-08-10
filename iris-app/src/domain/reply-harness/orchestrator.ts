import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { AgentContent } from "../../ports/agent-content-store.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { runDraftStage } from "./draft-stage.ts";
import { simpleReplyMaxChars } from "./reply-tier.ts";
import { runTriageStage } from "./triage-stage.ts";
import { runVerifyStage } from "./verify-stage.ts";
import type { HarnessRunResult, StageResult } from "./types.ts";

export type RunReplyHarnessInput = {
  context: ReplyContext;
  agentContent: AgentContent;
  llm: LlmCompleter;
  maxChars?: number;
  onStepComplete?: (step: StageResult) => void | Promise<void>;
};

async function emitStep(
  onStepComplete: RunReplyHarnessInput["onStepComplete"],
  step: StageResult,
) {
  if (onStepComplete) {
    await onStepComplete(step);
  }
}

export async function runReplyHarness(input: RunReplyHarnessInput): Promise<HarnessRunResult> {
  const personaMax = input.maxChars ?? input.context.persona.maxChars ?? 500;
  const steps: StageResult[] = [];

  const triage = await runTriageStage({
    context: input.context,
    agentContent: input.agentContent,
    llm: input.llm,
  });
  steps.push(triage);
  await emitStep(input.onStepComplete, triage);

  if (triage.replyTier === "none") {
    return {
      terminalStatus: "skipped_triage",
      replyTier: "none",
      steps,
      finalText: null,
    };
  }

  const draftMaxChars =
    triage.replyTier === "simple" ? simpleReplyMaxChars(personaMax) : personaMax;

  const draft = await runDraftStage({
    context: input.context,
    agentContent: input.agentContent,
    llm: input.llm,
    maxChars: draftMaxChars,
    tier: triage.replyTier,
  });
  steps.push(draft);
  await emitStep(input.onStepComplete, draft);

  if (draft.verdict !== "pass" || !draft.draftText) {
    return {
      terminalStatus: "rejected_verify",
      replyTier: triage.replyTier,
      steps,
      finalText: null,
    };
  }

  if (triage.replyTier === "simple") {
    return {
      terminalStatus: "approved_simple",
      replyTier: "simple",
      steps,
      finalText: draft.draftText,
    };
  }

  const verify = await runVerifyStage({
    context: input.context,
    agentContent: input.agentContent,
    llm: input.llm,
    draftText: draft.draftText,
    maxChars: personaMax,
  });
  steps.push(verify);
  await emitStep(input.onStepComplete, verify);

  if (verify.verdict !== "pass" || !verify.finalText) {
    return {
      terminalStatus: "rejected_verify",
      replyTier: "full",
      steps,
      finalText: null,
    };
  }

  return {
    terminalStatus: "approved",
    replyTier: "full",
    steps,
    finalText: verify.finalText,
  };
}
