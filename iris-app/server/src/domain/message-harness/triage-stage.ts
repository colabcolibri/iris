import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import { parseLlmJson } from "../reply-harness/parse-llm-json.ts";
import { stageLlmFromCompletion } from "../reply-harness/stage-llm.ts";
import { buildMessageTriagePrompt } from "./build-prompts.ts";
import {
  isMessageCategory,
  normalizeMessageCategory,
  type MessageCategory,
} from "./message-category.ts";
import type { MessageStageResult, MessageTriageStageOutput } from "./types.ts";

export type MessageTriageStageInput = {
  context: MessageReplyContext;
  restrictions: string;
  llm: LlmCompleter;
};

export type MessageTriageStageResult = MessageStageResult & {
  messageCategory: MessageCategory;
  shouldReply: boolean;
};

export async function runMessageTriageStage(
  input: MessageTriageStageInput,
): Promise<MessageTriageStageResult> {
  const prompt = buildMessageTriagePrompt(input.context, input.restrictions);
  const completion = await input.llm.complete(prompt);
  const raw = completion.text;
  const parsed = parseLlmJson<MessageTriageStageOutput>(raw);

  if (!parsed || typeof parsed.shouldReply !== "boolean") {
    const category: MessageCategory = "general_unclear";
    return {
      stage: "message_triage",
      verdict: "pass",
      messageCategory: category,
      shouldReply: true,
      reason: "invalid_llm_response_default_reply",
      reasoning: raw.slice(0, 2000),
      structured: {
        shouldReply: true,
        replyTier: "full",
        blockCategory: "other",
        reason: "invalid_llm_response_default_reply",
        reasoning: raw.slice(0, 2000),
      },
      llm: stageLlmFromCompletion(completion),
    };
  }

  const messageCategory = normalizeMessageCategory(parsed.messageCategory);
  const shouldReply =
    messageCategory === "harmful" ? false : parsed.shouldReply !== false;

  return {
    stage: "message_triage",
    verdict: shouldReply ? "pass" : "fail",
    messageCategory,
    productSlug:
      typeof parsed.productSlug === "string" ? parsed.productSlug : null,
    shouldReply,
    reason: parsed.reason?.trim() || `category:${messageCategory}`,
    reasoning: parsed.reasoning?.trim() || raw.slice(0, 2000),
    structured: {
      shouldReply,
      replyTier: shouldReply ? "full" : "none",
      blockCategory: messageCategory === "harmful" ? "harmful" : "other",
      reason: parsed.reason?.trim() || `category:${messageCategory}`,
      reasoning: parsed.reasoning?.trim() || raw.slice(0, 2000),
    },
    llm: stageLlmFromCompletion(completion),
  };
}

export function triageCategoryFromOutput(
  output: MessageTriageStageOutput | null,
): MessageCategory {
  if (output?.messageCategory && isMessageCategory(output.messageCategory)) {
    return output.messageCategory;
  }
  return "general_unclear";
}
