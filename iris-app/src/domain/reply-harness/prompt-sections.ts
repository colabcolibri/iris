import type { ReplyContext } from "../reply-context/types.ts";
import { buildThreadBlock } from "./build-thread-block.ts";
import type { ReplyTier } from "./reply-tier.ts";
import { buildBrandLine } from "./prompt-language.ts";

const SIMPLE_THREAD_MAX = 5;
const SIMPLE_CAPTION_MAX = 500;

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

export function threadForTier(context: ReplyContext, tier: ReplyTier): string {
  return buildThreadBlock(context.thread, {
    maxEntries: tier === "simple" ? SIMPLE_THREAD_MAX : undefined,
    brandName: context.persona.brandName,
  });
}

function carouselSummaryLine(context: ReplyContext): string | null {
  const summary =
    context.post?.carouselSummary?.trim() ?? context.imageContext.summaries[0]?.trim();
  if (!summary) {
    return null;
  }
  return `Carousel summary: ${summary}`;
}

export function buildContextSection(context: ReplyContext, tier: ReplyTier): string {
  const brandLine = buildBrandLine(context.persona);
  const carouselLine = carouselSummaryLine(context);
  return [
    brandLine,
    `Post caption: ${captionForTier(context, tier)}`,
    carouselLine,
    "",
    "Thread (chronological):",
    threadForTier(context, tier),
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
  return `thread:${threadCount} messages · ${brand}${captionNote}`;
}
