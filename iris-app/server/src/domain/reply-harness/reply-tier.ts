export type ReplyTier = "none" | "simple" | "full";

export type BlockCategory =
  | "none"
  | "harmful"
  | "crisis"
  | "hate_violence"
  | "spam"
  | "off_topic"
  | "not_for_brand"
  | "conversation_stalled"
  | "thread_reply_limit"
  | "other";

export const SIMPLE_REPLY_MAX_CHARS = 180;

export type TriageStageOutput = {
  replyTier?: ReplyTier;
  shouldReply?: boolean;
  blockCategory?: BlockCategory;
  reason: string;
  reasoning: string;
};

export type NormalizedTriageOutput = {
  shouldReply: boolean;
  replyTier: ReplyTier;
  blockCategory: BlockCategory;
  reason: string;
  reasoning: string;
};

const BLOCK_CATEGORIES: BlockCategory[] = [
  "none",
  "harmful",
  "crisis",
  "hate_violence",
  "spam",
  "off_topic",
  "not_for_brand",
  "conversation_stalled",
  "thread_reply_limit",
  "other",
];

export function normalizeBlockCategory(value: unknown): BlockCategory {
  if (typeof value === "string" && BLOCK_CATEGORIES.includes(value as BlockCategory)) {
    return value as BlockCategory;
  }
  return "none";
}

export function normalizeReplyTier(parsed: TriageStageOutput): ReplyTier {
  if (parsed.replyTier === "none" || parsed.replyTier === "simple" || parsed.replyTier === "full") {
    return parsed.replyTier;
  }

  if (parsed.shouldReply === false) {
    return "none";
  }

  if (parsed.shouldReply === true) {
    return "full";
  }

  return "none";
}

export function normalizeTriageOutput(parsed: TriageStageOutput): NormalizedTriageOutput {
  const blockCategory = normalizeBlockCategory(parsed.blockCategory);
  let replyTier = normalizeReplyTier(parsed);
  let shouldReply = typeof parsed.shouldReply === "boolean" ? parsed.shouldReply : replyTier !== "none";

  if (blockCategory !== "none") {
    replyTier = "none";
    shouldReply = false;
  } else if (!shouldReply) {
    replyTier = "none";
  }

  return {
    shouldReply,
    replyTier,
    blockCategory,
    reason: parsed.reason || "",
    reasoning: parsed.reasoning || "",
  };
}

export function formatTriageReason(triage: NormalizedTriageOutput): string {
  const parts: string[] = [];
  if (triage.blockCategory !== "none") {
    parts.push(`block:${triage.blockCategory}`);
  }
  parts.push(`tier:${triage.replyTier}`);
  if (triage.reason) {
    parts.push(triage.reason);
  }
  return parts.join(" · ");
}

export function simpleReplyMaxChars(personaMaxChars: number): number {
  return Math.min(SIMPLE_REPLY_MAX_CHARS, Math.max(80, Math.floor(personaMaxChars * 0.45)));
}
