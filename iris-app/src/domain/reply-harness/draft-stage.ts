import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { AgentContent } from "../../ports/agent-content-store.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { buildDraftContextSummary, buildDraftPrompt } from "./build-harness-prompt.ts";
import type { DraftDecisionJson } from "./decision-json.ts";
import type { ReplyTier } from "./reply-tier.ts";
import type { StageResult } from "./types.ts";

export type DraftStageInput = {
  context: ReplyContext;
  agentContent: AgentContent;
  llm: LlmCompleter;
  maxChars: number;
  tier: ReplyTier;
};

export async function runDraftStage(input: DraftStageInput): Promise<StageResult> {
  const contextSummary = buildDraftContextSummary(input.context, input.tier);
  const prompt = buildDraftPrompt(
    input.context,
    input.agentContent,
    input.maxChars,
    input.tier,
  );
  const draftText = (await input.llm.complete(prompt)).trim().slice(0, input.maxChars);

  const structured: DraftDecisionJson = {
    replyTier: input.tier,
    contextSummary,
    draftPreview: draftText.slice(0, 200),
  };

  return {
    stage: "draft",
    verdict: draftText ? "pass" : "fail",
    reason: draftText ? `draft_generated:${input.tier}` : "empty_draft",
    reasoning: draftText.slice(0, 2000),
    draftText,
    replyTier: input.tier,
    contextSummary,
    structured,
  };
}
