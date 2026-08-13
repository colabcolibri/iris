import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { MessageAgentContent } from "../../ports/message-agent-content-store.ts";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import { stageLlmFromCompletion } from "../reply-harness/stage-llm.ts";
import { buildMessageDraftPrompt } from "./build-prompts.ts";
import type { MessageCategory } from "./message-category.ts";
import type { MessageStageResult } from "./types.ts";

export type MessageDraftStageInput = {
  context: MessageReplyContext;
  agentContent: MessageAgentContent;
  llm: LlmCompleter;
  maxChars: number;
  messageCategory: MessageCategory;
};

export async function runMessageDraftStage(
  input: MessageDraftStageInput,
): Promise<MessageStageResult> {
  const prompt = buildMessageDraftPrompt(
    input.context,
    input.agentContent,
    input.maxChars,
    input.messageCategory,
  );
  const completion = await input.llm.complete(prompt);
  const draftText = completion.text.trim().slice(0, input.maxChars);

  return {
    stage: "message_draft",
    verdict: draftText ? "pass" : "fail",
    reason: draftText ? `draft_generated:${input.messageCategory}` : "empty_draft",
    reasoning: draftText.slice(0, 2000),
    draftText,
    messageCategory: input.messageCategory,
    structured: {
      replyTier: "full",
      contextSummary: input.messageCategory,
      draftPreview: draftText.slice(0, 200),
    },
    llm: stageLlmFromCompletion(completion),
  };
}
