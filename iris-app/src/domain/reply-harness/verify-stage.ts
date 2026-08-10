import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { AgentContent } from "../../ports/agent-content-store.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { buildVerifyPrompt } from "./build-harness-prompt.ts";
import type { VerifyDecisionJson } from "./decision-json.ts";
import { parseLlmJson } from "./parse-llm-json.ts";
import { stageLlmFromCompletion } from "./stage-llm.ts";
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
  const completion = await input.llm.complete(prompt);
  const raw = completion.text;
  const parsed = parseLlmJson<VerifyStageOutput>(raw);

  if (!parsed || typeof parsed.approved !== "boolean") {
    return {
      stage: "verify",
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
  const policyViolations = Array.isArray(parsed.policyViolations)
    ? parsed.policyViolations.map(String)
    : harmful
      ? ["harmful"]
      : [];
  const approved = parsed.approved && !harmful;
  const finalText = (parsed.finalText?.trim() || input.draftText).slice(0, input.maxChars);

  const structured: VerifyDecisionJson = {
    approved,
    harmful,
    policyViolations,
    reason: parsed.reason || (approved ? "approved" : "rejected"),
    reasoning: parsed.reasoning || raw.slice(0, 2000),
    finalText: approved ? finalText : undefined,
  };

  return {
    stage: "verify",
    verdict: approved ? "pass" : "fail",
    reason: structured.reason,
    reasoning: structured.reasoning,
    finalText: approved ? finalText : undefined,
    structured,
    llm: stageLlmFromCompletion(completion),
  };
}
