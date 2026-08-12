import type { ReplyContext } from "../reply-context/types.ts";
import { buildThreadBlock } from "./build-thread-block.ts";
import {
  describeCommentSignal,
  detectCommentSignal,
  isLowEvidenceSignal,
  type CommentSignal,
} from "./comment-signal.ts";
import type { ReplyTier } from "./reply-tier.ts";
import { buildBrandLine, buildTriageAudienceDirective } from "./prompt-language.ts";

const THREAD_CONTEXT_MAX = 16;
const SIMPLE_CAPTION_MAX = 500;
const LOW_SIGNAL_CAROUSEL_MAX = 280;

export function targetCommentLine(context: ReplyContext): string {
  const author = context.targetComment.authorUsername ?? "user";
  return `Target comment — @${author}: ${context.targetComment.text ?? ""}`;
}

export function captionForTier(context: ReplyContext, tier: ReplyTier): string {
  const caption = context.post?.caption ?? "(no caption)";
  if (tier === "simple" && caption.length > SIMPLE_CAPTION_MAX) {
    return `${caption.slice(0, SIMPLE_CAPTION_MAX - 1)}…`;
  }
  return caption;
}

export function threadForTier(context: ReplyContext, _tier: ReplyTier): string {
  return buildThreadBlock(context.thread, {
    maxEntries: THREAD_CONTEXT_MAX,
    brandName: context.persona.brandName,
    brandUsername: context.brandUsername,
    targetIgCommentId: context.targetComment.igCommentId,
  });
}

function carouselSummaryRaw(context: ReplyContext): string | null {
  const summary =
    context.post?.carouselSummary?.trim() ?? context.imageContext.summaries[0]?.trim();
  return summary || null;
}

function carouselSummaryLine(
  context: ReplyContext,
  options?: { maxChars?: number },
): string | null {
  const summary = carouselSummaryRaw(context);
  if (!summary) {
    return null;
  }
  const max = options?.maxChars;
  if (max !== undefined && summary.length > max) {
    return `Carousel summary: ${summary.slice(0, max - 1)}…`;
  }
  return `Carousel summary: ${summary}`;
}

export function commentSignalForContext(context: ReplyContext): CommentSignal {
  return detectCommentSignal(context.targetComment.text);
}

export function buildCommentSignalBlock(context: ReplyContext): string {
  const signal = commentSignalForContext(context);
  const lines = [
    "## Target comment surface (code hint — not a final verdict)",
    `Signal: ${signal}`,
    `Meaning: ${describeCommentSignal(signal)}`,
  ];
  if (isLowEvidenceSignal(signal)) {
    lines.push(
      "Intent guidance: this is likely light engagement (agree / react / laugh). You MAY still reply briefly to welcome them.",
      "Do NOT treat the short text as an invitation to analyze the user's words using the post theme.",
      "Do NOT invent what they meant, felt, or concluded.",
    );
  }
  return lines.join("\n");
}

export function buildContextSection(context: ReplyContext, tier: ReplyTier): string {
  const brandLine = buildBrandLine(context.persona);
  const signal = commentSignalForContext(context);
  const carouselLine = carouselSummaryLine(context, {
    maxChars: isLowEvidenceSignal(signal) ? LOW_SIGNAL_CAROUSEL_MAX : undefined,
  });
  return [
    brandLine,
    `Post caption: ${captionForTier(context, tier)}`,
    carouselLine,
    "",
    buildCommentSignalBlock(context),
    "",
    "Thread (chronological):",
    threadForTier(context, tier),
    "",
    targetCommentLine(context),
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export function buildTriageContextSection(context: ReplyContext): string {
  const brandLine = buildBrandLine(context.persona);
  const brandAccount = context.brandUsername?.trim()
    ? `Brand Instagram account: @${context.brandUsername.trim().replace(/^@+/, "")}`
    : null;
  const signal = commentSignalForContext(context);
  const carouselLine = carouselSummaryLine(context, {
    maxChars: isLowEvidenceSignal(signal)
      ? LOW_SIGNAL_CAROUSEL_MAX
      : SIMPLE_CAPTION_MAX,
  });

  return [
    brandLine,
    brandAccount,
    `Post caption: ${captionForTier(context, "simple")}`,
    carouselLine,
    "",
    buildCommentSignalBlock(context),
    "",
    buildTriageAudienceDirective(context),
    "",
    "Thread (chronological — oldest to newest):",
    buildThreadBlock(context.thread, {
      maxEntries: THREAD_CONTEXT_MAX,
      brandName: context.persona.brandName,
      brandUsername: context.brandUsername,
      targetIgCommentId: context.targetComment.igCommentId,
    }),
    "",
    targetCommentLine(context),
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export function buildDraftContextSummary(context: ReplyContext, tier: ReplyTier): string {
  const threadCount = context.thread.entries.length;
  const brand = context.persona.brandName ?? "brand";
  const captionNote = context.post?.caption
    ? ` · ${tier === "simple" ? "short" : "full"} caption`
    : "";
  const signal = commentSignalForContext(context);
  const signalNote = signal !== "substantive" ? ` · signal:${signal}` : "";
  return `thread:${threadCount} messages · ${brand}${captionNote}${signalNote}`;
}
