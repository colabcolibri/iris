import type { AgentContent } from "../../ports/agent-content-store.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { DEFAULT_GUARDRAIL_RULES } from "./default-guardrails.ts";
import { buildResponseLanguageDirective } from "./prompt-language.ts";
import {
  buildContextSection,
  captionForTier,
  targetCommentLine,
  threadForTier,
} from "./prompt-sections.ts";
import type { ReplyTier } from "./reply-tier.ts";

const TRIAGE_TIER_GUIDE = [
  "Classify the target comment:",
  "- Set shouldReply=false and the right blockCategory when you should not reply.",
  '- blockCategory "harmful": insults, harassment, hate speech.',
  '- blockCategory "spam": irrelevant promos or bots.',
  '- blockCategory "off_topic": no link to the post or brand.',
  '- replyTier "none": do not reply (includes any blockCategory other than none).',
  '- replyTier "simple": a short reply is enough (thanks, praise, simple question).',
  '- replyTier "full": needs explanation, product context, conflict handling, or sensitive tone.',
].join("\n");

export { buildDraftContextSummary } from "./prompt-sections.ts";

/** Lean triage: restrictions + guardrails + context — no SOUL/page/knowledge. */
export function buildTriagePrompt(context: ReplyContext, restrictions: string): string {
  return [
    "You classify Instagram comments for an automated reply agent.",
    "Decide whether to reply, the reply tier, and any block category.",
    "",
    TRIAGE_TIER_GUIDE,
    "",
    "## Brand restrictions",
    restrictions,
    "",
    "## Default guardrails",
    DEFAULT_GUARDRAIL_RULES,
    "",
    "## Context",
    buildContextSection(context, "simple"),
    "",
    buildResponseLanguageDirective(context.persona, { includeJsonNote: true }),
    "",
    "Reply with valid JSON only:",
    '{"shouldReply":true|false,"replyTier":"none"|"simple"|"full","blockCategory":"none"|"harmful"|"spam"|"off_topic"|"other","reason":"short label","reasoning":"brief explanation"}',
  ].join("\n");
}

/** Quick reply: brand + restrictions + knowledge snippet — no full SOUL/page. */
export function buildSimpleDraftPrompt(
  context: ReplyContext,
  agentContent: AgentContent,
  maxChars: number,
): string {
  return [
    "Write ONE short Instagram comment reply.",
    "Maximum 1–2 sentences. No hashtags. No long speeches.",
    "",
    buildResponseLanguageDirective(context.persona, { forPublicReply: true }),
    "",
    "## Brand restrictions",
    agentContent.restrictions,
    "",
    "## Links and facts (only if the comment asks)",
    agentContent.knowledge || "(no extra links — point to colabcolibri.com if needed)",
    "",
    "## Context",
    buildContextSection(context, "simple"),
    "",
    `Character limit: ${maxChars}.`,
    "REMINDER: the reply text MUST be in the configured response language above.",
  ].join("\n");
}

/** Elaborate reply: full editorial package. */
export function buildFullDraftPrompt(
  context: ReplyContext,
  agentContent: AgentContent,
  maxChars: number,
): string {
  return [
    "Write an Instagram comment reply on behalf of the brand.",
    "",
    buildResponseLanguageDirective(context.persona, { forPublicReply: true }),
    "",
    "## SOUL",
    agentContent.soul,
    "",
    "## About the page",
    agentContent.page,
    "",
    "## Knowledge base",
    agentContent.knowledge || "(empty)",
    "",
    "## Brand restrictions",
    agentContent.restrictions,
    "",
    "## Context",
    buildContextSection(context, "full"),
    "",
    `Write a helpful on-brand reply. No hashtags. Maximum ${maxChars} characters.`,
    "Return only the reply text — no JSON.",
    "REMINDER: the reply text MUST be in the configured response language above.",
  ].join("\n");
}

export function buildDraftPrompt(
  context: ReplyContext,
  agentContent: AgentContent,
  maxChars: number,
  tier: ReplyTier,
): string {
  if (tier === "simple") {
    return buildSimpleDraftPrompt(context, agentContent, maxChars);
  }
  return buildFullDraftPrompt(context, agentContent, maxChars);
}

export function buildVerifyPrompt(
  context: ReplyContext,
  agentContent: AgentContent,
  draftText: string,
  maxChars: number,
): string {
  const language = buildResponseLanguageDirective(context.persona);

  return [
    "You are the final auditor for automated Instagram replies.",
    "Validate whether the draft can be published.",
    "Mark harmful=true for insults, harassment, or discriminatory content.",
    "Reject the draft if it is not written in the mandatory response language.",
    "",
    language,
    "",
    "## Brand restrictions",
    agentContent.restrictions,
    "",
    "## Default guardrails",
    DEFAULT_GUARDRAIL_RULES,
    "",
    "## Context",
    `Caption: ${captionForTier(context, "simple")}`,
    "",
    "Thread:",
    threadForTier(context, "simple"),
    "",
    targetCommentLine(context),
    "",
    "## Candidate draft",
    draftText,
    "",
    `Character limit: ${maxChars}`,
    "",
    "Reply with valid JSON only:",
    '{"approved":true|false,"harmful":true|false,"policyViolations":["..."],"reason":"short label","reasoning":"explanation","finalText":"optional final text"}',
    "If approved=true and finalText is empty, the original draft will be used.",
    "finalText MUST respect the mandatory response language.",
  ].join("\n");
}

export function buildLightVerifyPrompt(
  context: ReplyContext,
  draftText: string,
): string {
  return [
    "Audit this short Instagram reply draft.",
    buildResponseLanguageDirective(context.persona, { includeJsonNote: true }),
    "Reject if the draft is not in the mandatory response language.",
    "",
    "Reply with valid JSON only:",
    '{"approved":true|false,"harmful":true|false,"policyViolations":[],"reason":"short label","reasoning":"brief"}',
    "",
    "Draft:",
    draftText,
  ].join("\n");
}
