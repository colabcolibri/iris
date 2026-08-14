import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { MessageAgentContent } from "../../ports/message-agent-content-store.ts";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import {
  runMessageAgenticDraftStage,
  type MessageAgenticDraftDeps,
} from "./agentic-draft-stage.ts";
import { runMessageTriageStage } from "./triage-stage.ts";
import type { MessageHarnessRunResult, MessageStageResult } from "./types.ts";
import { runMessageVerifyStage } from "./verify-stage.ts";

export type RunMessageHarnessInput = {
  context: MessageReplyContext;
  agentContent: MessageAgentContent;
  llm: LlmCompleter;
  maxChars?: number;
  harness?: MessageAgenticDraftDeps;
  onStepComplete?: (step: MessageStageResult) => void | Promise<void>;
};

async function emitStep(
  onStepComplete: RunMessageHarnessInput["onStepComplete"],
  step: MessageStageResult,
) {
  if (onStepComplete) {
    await onStepComplete(step);
  }
}

export async function runMessageHarness(
  input: RunMessageHarnessInput,
): Promise<MessageHarnessRunResult> {
  const personaMax = input.maxChars ?? input.context.persona.maxChars ?? 500;
  const steps: MessageStageResult[] = [];

  const triage = await runMessageTriageStage({
    context: input.context,
    restrictions: input.agentContent.dmRestrictions,
    llm: input.llm,
  });
  steps.push(triage);
  await emitStep(input.onStepComplete, triage);

  if (!triage.shouldReply || triage.messageCategory === "harmful") {
    return {
      terminalStatus: "blocked_harmful",
      messageCategory: triage.messageCategory,
      steps,
      finalText: null,
    };
  }

  if (!input.harness) {
    throw new Error("message harness requires agentic harness deps");
  }

  const focusedContext: MessageReplyContext = {
    ...input.context,
    products:
      triage.productSlug && input.context.products.length > 0
        ? input.context.products.filter((product) => product.slug === triage.productSlug)
        : input.context.products.slice(0, 1),
  };

  const draft = await runMessageAgenticDraftStage({
    context: focusedContext,
    agentContent: input.agentContent,
    llm: input.llm,
    maxChars: personaMax,
    messageCategory: triage.messageCategory,
    productSlug: triage.productSlug,
    triageHints: {
      reason: triage.reason,
      productSlug: triage.productSlug,
      messageCategory: triage.messageCategory,
      supportIntent: triage.supportIntent,
      supportUrgency: triage.supportUrgency,
    },
    harness: input.harness,
    onLoopStep: async (loopStep) => {
      const stage: MessageStageResult = {
        stage: loopStep.stage,
        verdict: loopStep.verdict,
        reason: loopStep.reason,
        reasoning: loopStep.reasoning,
        llm: loopStep.llm,
        structured: loopStep.toolName
          ? {
              turnIndex: loopStep.turnIndex,
              toolName: loopStep.toolName,
              toolInput: loopStep.toolInput ?? undefined,
              toolOutput: loopStep.toolOutput,
            }
          : {
              turnIndex: loopStep.turnIndex,
              llmContextJson: loopStep.llmContextJson ?? undefined,
            },
      };
      steps.push(stage);
      await emitStep(input.onStepComplete, stage);
    },
  });

  if (!draft.draftText) {
    const terminalStatus =
      draft.loopTerminalStatus === "budget_exceeded"
        ? "budget_exceeded"
        : "draft_failed";
    return {
      terminalStatus,
      messageCategory: triage.messageCategory,
      steps,
      finalText: null,
    };
  }

  if (draft.loopTerminalStatus === "escalated_operator") {
    return {
      terminalStatus: "escalated_operator",
      messageCategory: triage.messageCategory,
      steps,
      finalText: draft.draftText,
    };
  }

  const verify = await runMessageVerifyStage({
    context: input.context,
    agentContent: input.agentContent,
    llm: input.llm,
    draftText: draft.draftText,
    maxChars: personaMax,
    productFacts: draft.resolvedProducts,
  });
  steps.push(verify);
  await emitStep(input.onStepComplete, verify);

  if (verify.verdict !== "pass" || !verify.finalText) {
    return {
      terminalStatus: "rejected_verify",
      messageCategory: triage.messageCategory,
      steps,
      finalText: null,
    };
  }

  return {
    terminalStatus: "approved",
    messageCategory: triage.messageCategory,
    steps,
    finalText: verify.finalText,
  };
}
