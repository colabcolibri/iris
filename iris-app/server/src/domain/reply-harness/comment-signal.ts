/**
 * Surface-level signal of an Instagram comment before LLM triage/draft.
 * Not a semantic verdict — helps prompts avoid over-inference on low-evidence text.
 */

export type CommentSignal =
  | "empty"
  | "emoji_reaction"
  | "laughter"
  | "acknowledgment"
  | "substantive";

const ACK_TOKENS = new Set([
  "sim",
  "sí",
  "si",
  "yes",
  "yep",
  "yeah",
  "ok",
  "okay",
  "okk",
  "blz",
  "beleza",
  "certo",
  "certoo",
  "isso",
  "issoo",
  "exato",
  "exatamente",
  "verdade",
  "vdd",
  "concordo",
  "true",
  "real",
  "fato",
  "amei",
  "amo",
  "top",
  "show",
  "perfeito",
  "perfeita",
  "obrigado",
  "obrigada",
  "obg",
  "vlw",
  "valeu",
]);

const LAUGHTER_RE =
  /^(?:k{2,}|(?:ha)+h?|(?:he)+h?|(?:rs)+|lol+|lmao+|😅+|😂+|🤣+|😆+)$/iu;

const EMOJI_OR_SYMBOL_RE =
  /^(?:[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D\s!.?…❤️💛💚💙💜🧡🖤🤍🤎❣️💕💖💗💓💞💝💘]+)$/u;

function normalizeForSignal(raw: string): string {
  return raw
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[!?.,…~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

function isMostlyEmoji(value: string): boolean {
  const compact = value.replace(/\s+/g, "");
  if (!compact) {
    return false;
  }
  return EMOJI_OR_SYMBOL_RE.test(compact);
}

function isLaughterToken(token: string): boolean {
  return LAUGHTER_RE.test(token);
}

function isAckToken(token: string): boolean {
  const bare = stripDiacritics(token.replace(/^@[\w.]+$/u, "").trim());
  if (!bare) {
    return false;
  }
  if (ACK_TOKENS.has(bare)) {
    return true;
  }
  // elongated forms: simmm, okkk, issooo
  for (const ack of ACK_TOKENS) {
    if (bare.startsWith(ack) && bare.length <= ack.length + 4) {
      const rest = bare.slice(ack.length);
      if (/^(.)\1*$/u.test(rest) || rest === "") {
        return true;
      }
    }
  }
  return false;
}

export function detectCommentSignal(text: string | null | undefined): CommentSignal {
  const raw = text?.trim() ?? "";
  if (!raw) {
    return "empty";
  }

  if (isMostlyEmoji(raw)) {
    return "emoji_reaction";
  }

  const normalized = normalizeForSignal(raw);
  if (!normalized) {
    return isMostlyEmoji(raw) ? "emoji_reaction" : "empty";
  }

  const tokens = normalized.split(" ").filter(Boolean);
  if (tokens.length === 0) {
    return "empty";
  }

  // Short burst only — longer text stays substantive even if it contains "sim"
  if (tokens.length <= 3 && tokens.every((token) => isLaughterToken(token))) {
    return "laughter";
  }

  if (tokens.length <= 3 && tokens.every((token) => isAckToken(token) || isLaughterToken(token))) {
    const hasAck = tokens.some((token) => isAckToken(token));
    if (hasAck) {
      return "acknowledgment";
    }
    return "laughter";
  }

  // "Sim !" already covered; also pure punctuation leftovers
  if (tokens.length <= 2 && tokens.every((token) => isAckToken(token))) {
    return "acknowledgment";
  }

  return "substantive";
}

export function isLowEvidenceSignal(signal: CommentSignal): boolean {
  return signal !== "substantive";
}

/** Prompt-facing description for triage/draft/verify. */
export function describeCommentSignal(signal: CommentSignal): string {
  switch (signal) {
    case "empty":
      return "empty or non-textual — do not invent what the user meant";
    case "emoji_reaction":
      return "emoji/symbol reaction only — treat as light engagement, not a claim";
    case "laughter":
      return "laughter/reaction (kkk, haha, rs, etc.) — warm ack ok; no deep interpretation";
    case "acknowledgment":
      return "short acknowledgment (sim, ok, isso, verdade, etc.) without a clear claim or question";
    case "substantive":
      return "substantive text — may include claims, questions, or concrete context";
  }
}
