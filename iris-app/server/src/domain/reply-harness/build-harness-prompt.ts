import type { AgentContent } from "../../ports/agent-content-store.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { DEFAULT_GUARDRAIL_RULES } from "./default-guardrails.ts";
import {
  buildBrandBlock,
  buildMentionDirective,
  buildMentionVerifyNote,
  buildSignatureVerificationBlock,
} from "./prompt-language.ts";
import {
  buildContextSection,
  buildCommentSignalBlock,
  buildTriageContextSection,
  captionForTier,
  targetCommentLine,
  threadForTier,
} from "./prompt-sections.ts";
import type { ReplyTier } from "./reply-tier.ts";
import { MAX_BRAND_REPLIES_PER_THREAD } from "./thread-reply-brakes.ts";
import { SIGNATURE_SEPARATOR } from "./reply-signature-format.ts";

const POST_BRIEFING_PRECEDENCE =
  "This post-specific briefing OVERRIDES conflicting global editorial content (SOUL, page, knowledge, restrictions). Prioritize it when they disagree.";

function buildPostBriefingBlock(context: ReplyContext): string[] {
  const text = context.post?.replyPrompt?.trim();
  if (!text) {
    return [];
  }
  return ["## Post briefing", POST_BRIEFING_PRECEDENCE, text, ""];
}

function buildRestrictionsBlock(restrictions: string): string[] {
  if (!restrictions.trim()) {
    return [];
  }
  return ["## Brand restrictions", restrictions, ""];
}

function buildKnowledgeBlock(context: ReplyContext, knowledge: string): string[] {
  if (context.post?.silenceKnowledge) {
    return [];
  }
  const text = knowledge.trim() || "(no extra links — point to colabcolibri.com if needed)";
  return ["## Links and facts (only if the comment asks)", text, ""];
}

function buildSoulBlock(soul: string): string[] {
  if (!soul.trim()) {
    return [];
  }
  return ["## SOUL", soul, ""];
}

function buildPageBlock(page: string): string[] {
  if (!page.trim()) {
    return [];
  }
  return ["## About the page", page, ""];
}

function buildKnowledgeBaseBlock(context: ReplyContext, knowledge: string): string[] {
  if (context.post?.silenceKnowledge) {
    return [];
  }
  return ["## Knowledge base", knowledge.trim() || "(empty)", ""];
}

const TRIAGE_TIER_GUIDE = [
  "Classify the target comment:",
  "- Set shouldReply=false and the right blockCategory when you should not draft a brand reply.",
  '- blockCategory "crisis": suicide, self-harm, wanting to die, or clear acute life-risk distress. Prefer over-missing this.',
  '- blockCategory "hate_violence": nazi/fascist advocacy, racism, misogyny, or calls to violence/crime. Informative refusal — not debate.',
  '- blockCategory "harmful": insults/harassment that are NOT crisis and NOT hate_violence advocacy.',
  '- blockCategory "spam": irrelevant promos or bots.',
  '- blockCategory "off_topic": no link to the post or brand.',
  '- blockCategory "not_for_brand": users talking to each other; target is not directed at the brand (see Reply audience).',
  '- blockCategory "conversation_stalled": exchange resolved or going in circles — thanks/emoji/laughter after the brand answered, ping-pong without a new question, or repeating the same point.',
  `- blockCategory "thread_reply_limit": thread already has ${MAX_BRAND_REPLIES_PER_THREAD} brand replies (see Thread reply brakes).`,
  '- replyTier "none": do not use brand draft (includes any blockCategory other than none).',
  "- When the thread is not evolving, set shouldReply=false even if the comment is polite.",
  '- replyTier "simple": a short reply is enough (thanks, praise, simple question, light ack/emoji/laughter).',
  '- replyTier "full": needs explanation, product context, conflict handling, or sensitive tone.',
  "- Short laughter like Brazilian \"kkk\" is NOT hate_violence.",
  "",
  "Intent / evidence (read Target comment surface):",
  "- acknowledgment / emoji_reaction / laughter = LOW EVIDENCE. Prefer replyTier=simple if you reply.",
  "- You MAY still engage warmly (welcome, thanks for being here) — that is OK.",
  "- Do NOT classify low-evidence text as needing a full thematic essay about the post.",
  "- Do NOT invent the user's meaning, feelings, or conclusions from a short ack/emoji/kkk.",
  "- Off-topic block is for unrelated topics — not for short reactions to the post.",
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
    ...buildPostBriefingBlock(context),
    ...buildRestrictionsBlock(restrictions),
    "## Default guardrails",
    DEFAULT_GUARDRAIL_RULES,
    "",
    "## Context",
    buildTriageContextSection(context),
    "",
    "Reply with valid JSON only:",
    '{"shouldReply":true|false,"replyTier":"none"|"simple"|"full","blockCategory":"none"|"crisis"|"hate_violence"|"harmful"|"spam"|"off_topic"|"not_for_brand"|"conversation_stalled"|"thread_reply_limit"|"other","reason":"short label","reasoning":"brief explanation"}',
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
    "Anti over-inference (mandatory):",
    "- Reply only to what the user actually wrote. If the comment is a short ack, emoji, or laughter, keep a warm brief welcome — do not analyze their words.",
    "- Do NOT project the post theme onto the comment (e.g. do not treat \"Sim!\" as an ambiguous phrase to interpret).",
    "- Do NOT invent feelings, motives, or \"what is behind\" their short reaction.",
    "- Low evidence → low inference. Engaging is fine; pretending you understood unspoken meaning is not.",
    "",
    ...(brandBlock ? ["", brandBlock] : []),
    ...(mentionBlock ? ["", mentionBlock] : []),
    "",
    ...buildPostBriefingBlock(context),
    ...buildRestrictionsBlock(agentContent.restrictions),
    ...buildKnowledgeBlock(context, agentContent.knowledge),
    "## Context",
    buildContextSection(context, "simple"),
    "",
    `Character limit: ${maxChars}.`,
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
    ...(brandBlock ? ["", brandBlock] : []),
    ...(mentionBlock ? ["", mentionBlock] : []),
    "",
    ...buildPostBriefingBlock(context),
    ...buildSoulBlock(agentContent.soul),
    ...buildPageBlock(agentContent.page),
    ...buildKnowledgeBaseBlock(context, agentContent.knowledge),
    ...buildRestrictionsBlock(agentContent.restrictions),
    "## Context",
    buildContextSection(context, "full"),
    "",
    `Write a helpful on-brand reply. No hashtags. Maximum ${maxChars} characters.`,
    "Return only the reply text — no JSON.",
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
  const signatureBlock = buildSignatureVerificationBlock(context.persona);
  const mentionNote = buildMentionVerifyNote(context);
  const hasSignature = Boolean(signatureBlock);

  return [
    "You are the final auditor for automated Instagram replies.",
    "Validate whether the draft can be published.",
    "Set harmful=true for insults, harassment, or discriminatory content — in that case set approved=false.",
    "Reject the draft if it is not written in the configured response language.",
    'Reject with policyViolations including "over_inference" when the draft invents meaning, feelings, or interpretations the user did not express — especially on short acks, emojis, or laughter.',
    "Engaging warmly with a short reaction is OK; analyzing the reaction as if it were the post topic is not.",
    "",
    ...(mentionNote ? ["", mentionNote] : []),
    ...(signatureBlock ? ["", signatureBlock] : []),
    "",
    ...buildPostBriefingBlock(context),
    ...buildRestrictionsBlock(agentContent.restrictions),
    "## Default guardrails",
    DEFAULT_GUARDRAIL_RULES,
    "",
    "## Context",
    buildCommentSignalBlock(context),
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
      ? `When adding a closing, use body + ${JSON.stringify(SIGNATURE_SEPARATOR)} + sign-off (period on its own line). Skip the sign-off when identity is already clear in the body.`
      : "If approved=true and finalText is empty, the original draft will be used.",
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
    "Reject if the draft is not in the configured response language.",
    'Reject with policyViolations including "over_inference" if the draft invents what a short ack/emoji/laughter meant or projects the post theme onto it.',
    "Warm brief engagement is OK; interpretive essays about their short text are not.",
    ...(mentionNote ? ["", mentionNote] : []),
    ...(signatureBlock ? ["", signatureBlock] : []),
    "",
    buildCommentSignalBlock(context),
    "",
    targetCommentLine(context),
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
      ? `When adding a closing, use body + ${JSON.stringify(SIGNATURE_SEPARATOR)} + sign-off (period on its own line). Skip the sign-off when identity is already clear in the body.`
      : "If approved=true and finalText is empty, the original draft will be used.",
    "",
    "Draft:",
    draftText,
  ].join("\n");
}
