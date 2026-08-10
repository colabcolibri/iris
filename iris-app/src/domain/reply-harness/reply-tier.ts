export type ReplyTier = "none" | "simple" | "full";

export const SIMPLE_REPLY_MAX_CHARS = 180;

export type TriageStageOutput = {
  replyTier?: ReplyTier;
  shouldReply?: boolean;
  reason: string;
  reasoning: string;
};

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

export function simpleReplyMaxChars(personaMaxChars: number): number {
  return Math.min(SIMPLE_REPLY_MAX_CHARS, Math.max(80, Math.floor(personaMaxChars * 0.45)));
}
