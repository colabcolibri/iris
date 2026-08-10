/**
 * Estimativa rápida de tokens para prompts OpenAI-compat (gpt-4o, etc.).
 * Não usa tiktoken — útil para UI. Tende a ficar dentro de ~15% do valor real.
 */
export function estimateLlmTokens(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const chars = trimmed.length;

  // Português e markdown costumam ter ~3–4 chars/token; palavras longas pesam mais.
  const wordEstimate = Math.ceil(words * 1.35);
  const charEstimate = Math.ceil(chars / 3.5);

  return Math.max(wordEstimate, charEstimate);
}

export function formatTokenEstimate(tokens: number): string {
  if (tokens <= 0) return "vazio";
  if (tokens >= 1000) {
    const compact = tokens / 1000;
    const formatted =
      compact >= 10
        ? Math.round(compact).toLocaleString("pt-BR")
        : compact.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    return `≈ ${formatted}k tokens`;
  }
  return `≈ ${tokens.toLocaleString("pt-BR")} tokens`;
}
