import type { ReplyContext } from "../reply-context/types.ts";
import type { CommentThreadEntry } from "../reply-context/thread-context.ts";
import { sortThreadEntriesChronologically } from "../reply-context/thread-context.ts";
import {
  detectCommentSignal,
  isLowEvidenceSignal,
  type CommentSignal,
} from "./comment-signal.ts";
import type { BlockCategory } from "./reply-tier.ts";

/** Máximo de respostas da marca no mesmo thread (ramo incluído no contexto). */
export const MAX_BRAND_REPLIES_PER_THREAD = 10;

export type ThreadReplyBrakeReason =
  | "thread_reply_limit"
  | "conversation_stalled";

export type ThreadReplyBrake = {
  reason: ThreadReplyBrakeReason;
  blockCategory: BlockCategory;
  reasoning: string;
  brandReplyCount: number;
};

const FOLLOW_UP_INTENT_RE =
  /\?|\b(?:mas|porem|porém|ainda|quando|onde|como|qual|quanto|preciso|tem|vocês|voces|vcs|repõe|repor|entrega|frete|tamanho|preço|preco|comprar|link|não entendi|nao entendi|pode explicar|me ajuda|ajuda)\b/iu;

export function countBrandRepliesInThread(
  thread: ReplyContext["thread"],
): number {
  return thread.entries.filter((entry) => entry.isBrandReply).length;
}

function normalizeComparableText(text: string): string {
  return text
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[!?.,…~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function threadEntriesExcludingTarget(context: ReplyContext): CommentThreadEntry[] {
  const targetId = context.targetComment.igCommentId;
  const ordered = sortThreadEntriesChronologically(context.thread.entries);
  if (!targetId) {
    return ordered;
  }
  return ordered.filter((entry) => entry.igCommentId !== targetId);
}

function targetMentionsAnotherParticipant(context: ReplyContext): boolean {
  const text = context.targetComment.text ?? "";
  const mentions = [...text.matchAll(/@([\w.]+)/gu)].map((match) =>
    match[1]!.replace(/^@+/, "").toLowerCase(),
  );
  if (mentions.length === 0) {
    return false;
  }

  const brandHandle = context.brandUsername?.trim().replace(/^@+/, "").toLowerCase();
  if (!brandHandle) {
    return mentions.length > 0;
  }

  return mentions.some((handle) => handle !== brandHandle);
}

export function hasFollowUpIntent(text: string | null | undefined): boolean {
  const raw = text?.trim() ?? "";
  if (!raw) {
    return false;
  }
  return FOLLOW_UP_INTENT_RE.test(raw);
}

function targetSignal(context: ReplyContext): CommentSignal {
  return detectCommentSignal(context.targetComment.text);
}

function targetRepeatsPriorUserMessage(context: ReplyContext): boolean {
  const normalizedTarget = normalizeComparableText(context.targetComment.text ?? "");
  if (!normalizedTarget || normalizedTarget.length < 2) {
    return false;
  }

  const priorUserTexts = threadEntriesExcludingTarget(context)
    .filter((entry) => !entry.isBrandReply)
    .map((entry) => normalizeComparableText(entry.text ?? ""))
    .filter(Boolean);

  return priorUserTexts.includes(normalizedTarget);
}

function lastSpeakerBeforeTarget(
  context: ReplyContext,
): "brand" | "user" | null {
  const beforeTarget = threadEntriesExcludingTarget(context);
  const last = beforeTarget.at(-1);
  if (!last) {
    return null;
  }
  return last.isBrandReply ? "brand" : "user";
}

function countLowEvidenceUserTurnsAfterFirstBrandReply(
  context: ReplyContext,
): number {
  const beforeTarget = threadEntriesExcludingTarget(context).filter(
    (entry) => !entry.isBrandReply,
  );
  const ordered = sortThreadEntriesChronologically(beforeTarget);

  let seenBrandReply = false;
  let count = 0;

  for (const entry of ordered) {
    if (entry.isBrandReply) {
      seenBrandReply = true;
      continue;
    }
    if (!seenBrandReply) {
      continue;
    }
    const signal = detectCommentSignal(entry.text);
    if (isLowEvidenceSignal(signal)) {
      count += 1;
    } else {
      count = 0;
    }
  }

  const target = targetSignal(context);
  if (seenBrandReply && isLowEvidenceSignal(target)) {
    count += 1;
  }

  return count;
}

function isStalledExchange(context: ReplyContext, brandReplyCount: number): boolean {
  if (brandReplyCount === 0) {
    return false;
  }

  if (targetMentionsAnotherParticipant(context)) {
    return false;
  }

  if (hasFollowUpIntent(context.targetComment.text)) {
    return false;
  }

  const signal = targetSignal(context);
  if (signal === "substantive") {
    return false;
  }

  if (targetRepeatsPriorUserMessage(context)) {
    return true;
  }

  if (countLowEvidenceUserTurnsAfterFirstBrandReply(context) >= 2) {
    return true;
  }

  if (isLowEvidenceSignal(signal) && lastSpeakerBeforeTarget(context) === "brand") {
    return true;
  }

  return false;
}

/**
 * Freios determinísticos antes da triagem LLM: limite de respostas da marca
 * e troca que não evolui (agradecimento reativo, ping-pong, texto repetido).
 */
export function evaluateThreadReplyBrakes(
  context: ReplyContext,
): ThreadReplyBrake | null {
  const brandReplyCount = countBrandRepliesInThread(context.thread);

  if (brandReplyCount >= MAX_BRAND_REPLIES_PER_THREAD) {
    return {
      reason: "thread_reply_limit",
      blockCategory: "thread_reply_limit",
      brandReplyCount,
      reasoning: `Thread already has ${brandReplyCount} brand replies (max ${MAX_BRAND_REPLIES_PER_THREAD}).`,
    };
  }

  if (isStalledExchange(context, brandReplyCount)) {
    return {
      reason: "conversation_stalled",
      blockCategory: "conversation_stalled",
      brandReplyCount,
      reasoning:
        "Exchange is not evolving: low-evidence follow-up after the brand already replied, repeated message, or ping-pong without a new question.",
    };
  }

  return null;
}

export function buildThreadBrakeContextBlock(context: ReplyContext): string {
  const brandReplyCount = countBrandRepliesInThread(context.thread);
  return [
    "## Thread reply brakes (code + triage)",
    `Brand replies in this thread: ${brandReplyCount} / ${MAX_BRAND_REPLIES_PER_THREAD}.`,
    "Do not reply when the exchange adds no new information (thanks/emoji/laughter after resolution, circular back-and-forth, repeating the same point).",
    'Use blockCategory "conversation_stalled" and shouldReply=false when the thread is going in circles or already resolved.',
    `Use blockCategory "thread_reply_limit" and shouldReply=false when brand replies are at or above ${MAX_BRAND_REPLIES_PER_THREAD}.`,
  ].join("\n");
}
