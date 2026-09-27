import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { AgentContent } from "../../ports/agent-content-store.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { buildTriagePrompt } from "./build-harness-prompt.ts";
import type { TriageDecisionJson } from "./decision-json.ts";
import { completeAgentPrompt } from "./agent-prompt.ts";
import { parseLlmJson } from "./parse-llm-json.ts";
import { stageLlmFromCompletion } from "./stage-llm.ts";
import {
  formatTriageReason,
  normalizeTriageOutput,
  type ReplyTier,
  type TriageStageOutput,
} from "./reply-tier.ts";
import { evaluateThreadReplyBrakes } from "./thread-reply-brakes.ts";
import type { StageResult } from "./types.ts";

export type TriageStageInput = {
  context: ReplyContext;
  agentContent: AgentContent;
  llm: LlmCompleter;
};

export type TriageStageResult = StageResult & {
  replyTier: ReplyTier;
};

function triageResultFromThreadBrake(
  brake: NonNullable<ReturnType<typeof evaluateThreadReplyBrakes>>,
): TriageStageResult {
  const structured = {
    shouldReply: false,
    replyTier: "none" as const,
    blockCategory: brake.blockCategory,
    reason: brake.reason,
    reasoning: brake.reasoning,
  };

  return {
    stage: "triage",
    verdict: "fail",
    replyTier: "none",
    blockCategory: brake.blockCategory,
    reason: formatTriageReason(structured),
    reasoning: brake.reasoning,
    structured,
  };
}

export async function runTriageStage(input: TriageStageInput): Promise<TriageStageResult> {
  const threadBrake = evaluateThreadReplyBrakes(input.context);
  if (threadBrake) {
    return triageResultFromThreadBrake(threadBrake);
  }

  const promptBody = buildTriagePrompt(input.context, input.agentContent.restrictions);
  const completion = await completeAgentPrompt(input.llm, input.context.persona, promptBody, {
    complement: "triageJsonNote",
    source: "triage",
  });
  const raw = completion.text;
  const parsed = parseLlmJson<TriageStageOutput>(raw);

  if (!parsed || (!parsed.replyTier && typeof parsed.shouldReply !== "boolean")) {
    return {
      stage: "triage",
      verdict: "fail",
      replyTier: "none",
      blockCategory: "other",
      reason: "invalid_llm_response",
      reasoning: raw.slice(0, 2000),
      structured: {
        shouldReply: false,
        replyTier: "none",
        blockCategory: "other",
        reason: "invalid_llm_response",
        reasoning: raw.slice(0, 2000),
      },
      llm: stageLlmFromCompletion(completion),
    };
  }

  const triage = normalizeTriageOutput(parsed);
  const structured: TriageDecisionJson = {
    shouldReply: triage.shouldReply,
    replyTier: triage.replyTier,
    blockCategory: triage.blockCategory,
    reason: triage.reason,
    reasoning: triage.reasoning || raw.slice(0, 2000),
  };

  return {
    stage: "triage",
    verdict: triage.replyTier === "none" ? "fail" : "pass",
    replyTier: triage.replyTier,
    blockCategory: triage.blockCategory,
    reason: formatTriageReason(triage),
    reasoning: structured.reasoning,
    structured,
    llm: stageLlmFromCompletion(completion),
  };
}
