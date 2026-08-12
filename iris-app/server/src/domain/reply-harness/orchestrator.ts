import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { AgentContent } from "../../ports/agent-content-store.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { runBarrierStage } from "./barrier-stage.ts";
import { runDraftStage } from "./draft-stage.ts";
import { runLightVerifyStage } from "./light-verify.ts";
import { simpleReplyMaxChars, type BlockCategory } from "./reply-tier.ts";
import { isSafetyBarrierKind } from "./safety-barrier-policy.ts";
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

function terminalForNoneTier(blockCategory: BlockCategory | undefined): HarnessRunResult["terminalStatus"] {
  if (isSafetyBarrierKind(blockCategory)) {
    return "barrier_reply";
  }
  if (blockCategory === "harmful") {
    return "blocked_harmful";
  }
  return "skipped_triage";
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

  if (isSafetyBarrierKind(triage.blockCategory)) {
    const barrier = await runBarrierStage({
      context: input.context,
      llm: input.llm,
      kind: triage.blockCategory,
      maxChars: personaMax,
    });
    steps.push(barrier);
    await emitStep(input.onStepComplete, barrier);

    if (barrier.verdict !== "pass" || !barrier.finalText) {
      return {
        terminalStatus: "rejected_verify",
        replyTier: "none",
        steps,
        finalText: null,
      };
    }

    return {
      terminalStatus: "barrier_reply",
      replyTier: "none",
      steps,
      finalText: barrier.finalText,
    };
  }

  if (triage.replyTier === "none") {
    return {
      terminalStatus: terminalForNoneTier(triage.blockCategory),
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
    const verify = await runLightVerifyStage({
      context: input.context,
      draftText: draft.draftText,
      maxChars: draftMaxChars,
      llm: input.llm,
    });
    steps.push(verify);
    await emitStep(input.onStepComplete, verify);

    if (verify.verdict !== "pass" || !verify.finalText) {
      return {
        terminalStatus: "rejected_verify",
        replyTier: "simple",
        steps,
        finalText: null,
      };
    }

    return {
      terminalStatus: "approved_simple",
      replyTier: "simple",
      steps,
      finalText: verify.finalText,
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
