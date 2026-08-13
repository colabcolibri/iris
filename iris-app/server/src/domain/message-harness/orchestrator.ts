import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { MessageAgentContent } from "../../ports/message-agent-content-store.ts";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import { runMessageDraftStage } from "./draft-stage.ts";
import { runMessageTriageStage } from "./triage-stage.ts";
import type { MessageHarnessRunResult, MessageStageResult } from "./types.ts";
import { runMessageVerifyStage } from "./verify-stage.ts";

export type RunMessageHarnessInput = {
  context: MessageReplyContext;
  agentContent: MessageAgentContent;
  llm: LlmCompleter;
  maxChars?: number;
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

  const draft = await runMessageDraftStage({
    context: input.context,
    agentContent: input.agentContent,
    llm: input.llm,
    maxChars: personaMax,
    messageCategory: triage.messageCategory,
  });
  steps.push(draft);
  await emitStep(input.onStepComplete, draft);

  if (draft.verdict !== "pass" || !draft.draftText) {
    return {
      terminalStatus: "rejected_verify",
      messageCategory: triage.messageCategory,
      steps,
      finalText: null,
    };
  }

  const verify = await runMessageVerifyStage({
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
