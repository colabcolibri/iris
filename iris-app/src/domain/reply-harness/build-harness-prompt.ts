import type { AgentContent } from "../../ports/agent-content-store.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { DEFAULT_GUARDRAIL_RULES } from "./default-guardrails.ts";
import { buildBrandBlock, buildMentionDirective, buildMentionVerifyNote, buildResponseLanguageDirective, buildSignatureVerificationBlock } from "./prompt-language.ts";
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
  const brandBlock = buildBrandBlock(context.persona);
  const mentionBlock = buildMentionDirective(context);

  return [
    "Write ONE short Instagram comment reply.",
    "Maximum 1–2 sentences. No hashtags. No long speeches.",
    "",
    buildResponseLanguageDirective(context.persona, { forPublicReply: true }),
    ...(brandBlock ? ["", brandBlock] : []),
    ...(mentionBlock ? ["", mentionBlock] : []),
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
  const brandBlock = buildBrandBlock(context.persona);
  const mentionBlock = buildMentionDirective(context);

  return [
    "Write an Instagram comment reply on behalf of the brand.",
    "",
    buildResponseLanguageDirective(context.persona, { forPublicReply: true }),
    ...(brandBlock ? ["", brandBlock] : []),
    ...(mentionBlock ? ["", mentionBlock] : []),
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
  const signatureBlock = buildSignatureVerificationBlock(context.persona);
  const mentionNote = buildMentionVerifyNote(context);
  const hasSignature = Boolean(signatureBlock);

  return [
    "You are the final auditor for automated Instagram replies.",
    "Validate whether the draft can be published.",
    "Set harmful=true for insults, harassment, or discriminatory content — in that case set approved=false.",
    "Reject the draft if it is not written in the mandatory response language.",
    "",
    language,
    ...(mentionNote ? ["", mentionNote] : []),
    ...(signatureBlock ? ["", signatureBlock] : []),
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
    `Draft character limit (body only): ${maxChars}`,
    ...(hasSignature
      ? ["Adding the signature in finalText may exceed this limit."]
      : []),
    "",
    "Reply with valid JSON only:",
    '{"approved":true|false,"harmful":true|false,"policyViolations":["..."],"reason":"short label","reasoning":"explanation","finalText":"complete publishable reply"}',
    "If approved=true, finalText is the publishable reply — you may polish tone and closing.",
    hasSignature
      ? "Adapt the closing voice naturally per the guidance above; exact wording is not required."
      : "If approved=true and finalText is empty, the original draft will be used.",
    "finalText MUST respect the mandatory response language.",
  ].join("\n");
}

export function buildLightVerifyPrompt(
  context: ReplyContext,
  draftText: string,
  maxChars: number,
): string {
  const signatureBlock = buildSignatureVerificationBlock(context.persona);
  const mentionNote = buildMentionVerifyNote(context);
  const hasSignature = Boolean(signatureBlock);

  return [
    "Audit this short Instagram reply draft.",
    "Set harmful=true for insults, harassment, or discriminatory content — in that case set approved=false.",
    buildResponseLanguageDirective(context.persona, { includeJsonNote: true }),
    "Reject if the draft is not in the mandatory response language.",
    ...(mentionNote ? ["", mentionNote] : []),
    ...(signatureBlock ? ["", signatureBlock] : []),
    "",
    `Draft character limit (body only): ${maxChars}`,
    ...(hasSignature
      ? ["Adding the signature in finalText may exceed this limit."]
      : []),
    "",
    "Reply with valid JSON only:",
    '{"approved":true|false,"harmful":true|false,"policyViolations":[],"reason":"short label","reasoning":"brief","finalText":"complete publishable reply"}',
    "If approved=true, finalText is the publishable reply — you may polish tone and closing.",
    hasSignature
      ? "Adapt the closing voice naturally per the guidance above; exact wording is not required."
      : "If approved=true and finalText is empty, the original draft will be used.",
    "",
    "Draft:",
    draftText,
  ].join("\n");
}
