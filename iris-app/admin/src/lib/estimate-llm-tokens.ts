import { formatNumber } from "@/i18n/formatting";
import { interpolate } from "@/i18n/compose";
import type { AppLocale } from "@/i18n/types";

/**
 * Estimativa rápida de tokens para prompts OpenAI-compat (gpt-4o, etc.).
 * Não usa tiktoken — útil para UI. Tende a ficar dentro de ~15% do valor real.
 */
export function estimateLlmTokens(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const chars = trimmed.length;

  const wordEstimate = Math.ceil(words * 1.35);
  const charEstimate = Math.ceil(chars / 3.5);

  return Math.max(wordEstimate, charEstimate);
}

type TokenEstimateLabels = {
  empty: string;
  tokensK: string;
  tokens: string;
};

export function formatTokenEstimate(
  tokens: number,
  locale: AppLocale,
  labels: TokenEstimateLabels,
): string {
  if (tokens <= 0) return labels.empty;
  if (tokens >= 1000) {
    const compact = tokens / 1000;
    const formatted =
      compact >= 10
        ? formatNumber(Math.round(compact), locale)
        : formatNumber(compact, locale);
    return interpolate(labels.tokensK, { value: formatted });
  }
  return interpolate(labels.tokens, {
    value: formatNumber(tokens, locale),
  });
}
