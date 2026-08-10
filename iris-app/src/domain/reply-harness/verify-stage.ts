import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { AgentContent } from "../../ports/agent-content-store.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { buildVerifyPrompt } from "./build-harness-prompt.ts";
import { parseLlmJson } from "./parse-llm-json.ts";
import type { StageResult, VerifyStageOutput } from "./types.ts";

export type VerifyStageInput = {
  context: ReplyContext;
  agentContent: AgentContent;
  llm: LlmCompleter;
  draftText: string;
  maxChars: number;
};

export async function runVerifyStage(input: VerifyStageInput): Promise<StageResult> {
  const prompt = buildVerifyPrompt(
    input.context,
    input.agentContent,
    input.draftText,
    input.maxChars,
  );
  const raw = await input.llm.complete(prompt);
  const parsed = parseLlmJson<VerifyStageOutput>(raw);

  if (!parsed || typeof parsed.approved !== "boolean") {
    return {
      stage: "verify",
      verdict: "fail",
      reason: "invalid_llm_response",
      reasoning: raw.slice(0, 2000),
    };
  }

  const finalText = (parsed.finalText?.trim() || input.draftText).slice(0, input.maxChars);

  return {
    stage: "verify",
    verdict: parsed.approved ? "pass" : "fail",
    reason: parsed.reason || (parsed.approved ? "approved" : "rejected"),
    reasoning: parsed.reasoning || raw.slice(0, 2000),
    finalText: parsed.approved ? finalText : undefined,
  };
}
