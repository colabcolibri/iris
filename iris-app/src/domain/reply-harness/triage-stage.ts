import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { AgentContent } from "../../ports/agent-content-store.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { buildTriagePrompt } from "./build-harness-prompt.ts";
import { parseLlmJson } from "./parse-llm-json.ts";
import {
  normalizeReplyTier,
  type ReplyTier,
  type TriageStageOutput,
} from "./reply-tier.ts";
import type { StageResult } from "./types.ts";

export type TriageStageInput = {
  context: ReplyContext;
  agentContent: AgentContent;
  llm: LlmCompleter;
};

export type TriageStageResult = StageResult & {
  replyTier: ReplyTier;
};

export async function runTriageStage(input: TriageStageInput): Promise<TriageStageResult> {
  const prompt = buildTriagePrompt(input.context, input.agentContent.restrictions);
  const raw = await input.llm.complete(prompt);
  const parsed = parseLlmJson<TriageStageOutput>(raw);

  if (!parsed || (!parsed.replyTier && typeof parsed.shouldReply !== "boolean")) {
    return {
      stage: "triage",
      verdict: "fail",
      replyTier: "none",
      reason: "invalid_llm_response",
      reasoning: raw.slice(0, 2000),
    };
  }

  const replyTier = normalizeReplyTier(parsed);

  return {
    stage: "triage",
    verdict: replyTier === "none" ? "fail" : "pass",
    replyTier,
    reason: parsed.reason || (replyTier === "none" ? "blocked" : `tier:${replyTier}`),
    reasoning: parsed.reasoning || raw.slice(0, 2000),
  };
}
