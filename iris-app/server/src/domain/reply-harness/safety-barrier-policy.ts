/**
 * Policy for safety barrier replies — no canned copy, no comment regex.
 * Classification: triage LLM. Wording: barrier LLM. This module only
 * encodes brand-language routing and post-checks on the model output.
 */

export type SafetyBarrierKind = "crisis" | "hate_violence";

export function isSafetyBarrierKind(
  value: string | null | undefined,
): value is SafetyBarrierKind {
  return value === "crisis" || value === "hate_violence";
}

/** CVV / Brasil only when reply language config is Brazilian Portuguese. */
export function usesBrazilCrisisResources(language: string | null | undefined): boolean {
  const normalized = (language ?? "").trim().toLowerCase();
  return normalized === "pt-br" || normalized === "pt";
}

export function ensureAuthorMention(body: string, authorUsername?: string | null): string {
  const trimmed = body.trim();
  const handle = authorUsername?.trim().replace(/^@/, "") ?? "";
  if (!trimmed || !handle) {
    return trimmed;
  }
  if (trimmed.toLowerCase().startsWith(`@${handle.toLowerCase()}`)) {
    return trimmed;
  }
  return `@${handle} ${trimmed}`;
}

/**
 * Soft gate: required facts must appear in the LLM text.
 * Does not invent wording — only rejects incomplete barrier drafts.
 */
export function barrierReplyMeetsRequirements(
  kind: SafetyBarrierKind,
  responseLanguage: string | null | undefined,
  text: string,
): boolean {
  const normalized = text.trim().toLowerCase();
  if (normalized.length < 24) {
    return false;
  }

  if (kind === "crisis") {
    if (usesBrazilCrisisResources(responseLanguage)) {
      return normalized.includes("188") && normalized.includes("cvv");
    }
    return /emergency|hotline|crisis|ajuda|emergenc|secours|ayuda|nothilfe|emergenza/.test(
      normalized,
    );
  }

  return (
    /(assistente virtual|virtual assistant)/.test(normalized) &&
    /(ódio|hate|discrimina|viol[eê]ncia|violence|crime)/.test(normalized)
  );
}
