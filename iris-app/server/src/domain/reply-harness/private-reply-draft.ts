import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { AgentContent } from "../../ports/agent-content-store.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { buildDraftContextSummary, buildDraftPrompt } from "./build-harness-prompt.ts";
import { completeAgentPrompt } from "./agent-prompt.ts";
import type { ReplyTier } from "./reply-tier.ts";

const PRIVATE_DM_INSTRUCTION = [
  "You are drafting a PRIVATE Instagram direct message (not a public comment reply).",
  "The user commented on a post; this DM is the first private message allowed by Meta.",
  "Include promo links, coupons, or next steps from the post briefing when relevant.",
  "Keep it warm and concise — one message only; no hashtags.",
].join(" ");

export async function runPrivateReplyDraft(input: {
  context: ReplyContext;
  agentContent: AgentContent;
  llm: LlmCompleter;
  maxChars: number;
  tier?: ReplyTier;
}): Promise<string | null> {
  const tier = input.tier ?? "full";
  const contextSummary = buildDraftContextSummary(input.context, tier);
  const promptBody = [
    PRIVATE_DM_INSTRUCTION,
    "",
    buildDraftPrompt(input.context, input.agentContent, input.maxChars, tier),
    "",
    `Context summary: ${contextSummary}`,
  ].join("\n");

  const completion = await completeAgentPrompt(input.llm, input.context.persona, promptBody, {
    complement: "privateDmOnly",
    maxOutputChars: input.maxChars,
    source: "private_reply",
  });

  const text = completion.text.trim().slice(0, input.maxChars);
  return text || null;
}
