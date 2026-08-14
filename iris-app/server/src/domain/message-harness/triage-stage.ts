import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import { parseLlmJson } from "../reply-harness/parse-llm-json.ts";
import { completeAgentPrompt } from "../reply-harness/agent-prompt.ts";
import { stageLlmFromCompletion } from "../reply-harness/stage-llm.ts";
import { buildMessageTriagePrompt } from "./build-prompts.ts";
import {
  isMessageCategory,
  normalizeMessageCategory,
  type MessageCategory,
} from "./message-category.ts";
import {
  inferSupportSignals,
  type SupportIntent,
  type SupportUrgency,
} from "./support-intent.ts";
import type { MessageStageResult, MessageTriageStageOutput } from "./types.ts";

export type MessageTriageStageInput = {
  context: MessageReplyContext;
  restrictions: string;
  llm: LlmCompleter;
};

export type MessageTriageStageResult = MessageStageResult & {
  messageCategory: MessageCategory;
  shouldReply: boolean;
  supportIntent: SupportIntent;
  supportUrgency: SupportUrgency;
};

export async function runMessageTriageStage(
  input: MessageTriageStageInput,
): Promise<MessageTriageStageResult> {
  const promptBody = buildMessageTriagePrompt(input.context, input.restrictions);
  const completion = await completeAgentPrompt(input.llm, input.context.persona, promptBody, {
    complement: "triageJsonNote",
  });
  const raw = completion.text;
  const parsed = parseLlmJson<MessageTriageStageOutput>(raw);

  if (!parsed || typeof parsed.shouldReply !== "boolean") {
    const category: MessageCategory = "general_unclear";
    const support = inferSupportSignals(input.context);
    return {
      stage: "message_triage",
      verdict: "pass",
      messageCategory: category,
      shouldReply: true,
      supportIntent: support.supportIntent,
      supportUrgency: support.supportUrgency,
      reason: "invalid_llm_response_default_reply",
      reasoning: raw.slice(0, 2000),
      structured: {
        shouldReply: true,
        replyTier: "full",
        blockCategory: "other",
        reason: "invalid_llm_response_default_reply",
        reasoning: raw.slice(0, 2000),
        supportIntent: support.supportIntent,
        supportUrgency: support.supportUrgency,
      },
      llm: stageLlmFromCompletion(completion),
    };
  }

  const messageCategory = normalizeMessageCategory(parsed.messageCategory);
  const shouldReply =
    messageCategory === "harmful" ? false : parsed.shouldReply !== false;
  const support = inferSupportSignals(
    input.context,
    parsed.supportIntent,
    parsed.supportUrgency,
    messageCategory,
  );

  return {
    stage: "message_triage",
    verdict: shouldReply ? "pass" : "fail",
    messageCategory,
    productSlug:
      typeof parsed.productSlug === "string" ? parsed.productSlug : null,
    shouldReply,
    supportIntent: support.supportIntent,
    supportUrgency: support.supportUrgency,
    reason: parsed.reason?.trim() || `category:${messageCategory}`,
    reasoning: parsed.reasoning?.trim() || raw.slice(0, 2000),
    structured: {
      shouldReply,
      replyTier: shouldReply ? "full" : "none",
      blockCategory: messageCategory === "harmful" ? "harmful" : "other",
      reason: parsed.reason?.trim() || `category:${messageCategory}`,
      reasoning: parsed.reasoning?.trim() || raw.slice(0, 2000),
      supportIntent: support.supportIntent,
      supportUrgency: support.supportUrgency,
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
