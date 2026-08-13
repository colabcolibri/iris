import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { MessageAgentContent } from "../../ports/message-agent-content-store.ts";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import { parseLlmJson } from "../reply-harness/parse-llm-json.ts";
import { stageLlmFromCompletion } from "../reply-harness/stage-llm.ts";
import { buildMessageVerifyPrompt } from "./build-prompts.ts";
import type { MessageStageResult, MessageVerifyStageOutput } from "./types.ts";

export type MessageVerifyStageInput = {
  context: MessageReplyContext;
  agentContent: MessageAgentContent;
  llm: LlmCompleter;
  draftText: string;
  maxChars: number;
};

export async function runMessageVerifyStage(
  input: MessageVerifyStageInput,
): Promise<MessageStageResult> {
  const prompt = buildMessageVerifyPrompt(
    input.context,
    input.agentContent,
    input.draftText,
    input.maxChars,
  );
  const completion = await input.llm.complete(prompt);
  const raw = completion.text;
  const parsed = parseLlmJson<MessageVerifyStageOutput>(raw);

  if (!parsed || typeof parsed.approved !== "boolean") {
    return {
      stage: "message_verify",
      verdict: "fail",
      reason: "invalid_llm_response",
      reasoning: raw.slice(0, 2000),
      structured: {
        approved: false,
        harmful: false,
        policyViolations: ["invalid_llm_response"],
        reason: "invalid_llm_response",
        reasoning: raw.slice(0, 2000),
      },
      llm: stageLlmFromCompletion(completion),
    };
  }

  const harmful = parsed.harmful === true;
  const approved = parsed.approved && !harmful;
  const finalText = approved
    ? (parsed.finalText?.trim() || input.draftText.trim()).slice(0, input.maxChars)
    : undefined;

  return {
    stage: "message_verify",
    verdict: approved && finalText ? "pass" : "fail",
    reason: parsed.reason?.trim() || (approved ? "approved" : "rejected"),
    reasoning: parsed.reasoning?.trim() || raw.slice(0, 2000),
    finalText,
    structured: {
      approved,
      harmful,
      policyViolations: Array.isArray(parsed.policyViolations)
        ? parsed.policyViolations.map(String)
        : harmful
          ? ["harmful"]
          : [],
      reason: parsed.reason?.trim() || (approved ? "approved" : "rejected"),
      reasoning: parsed.reasoning?.trim() || raw.slice(0, 2000),
      finalText,
    },
    llm: stageLlmFromCompletion(completion),
  };
}
