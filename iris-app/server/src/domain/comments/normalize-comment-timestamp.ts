/** Normaliza timestamps da Meta (ex.: `+0000` sem dois-pontos) para ISO UTC. */
export function normalizeCommentTimestamp(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  const withColonOffset = trimmed.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const ms = Date.parse(withColonOffset);

  if (Number.isNaN(ms)) {
    return trimmed;
  }

  return new Date(ms).toISOString();
}

export function commentTimestampToMs(value: string | null | undefined): number {
  const normalized = normalizeCommentTimestamp(value);
  if (!normalized) {
    return 0;
  }

  const ms = Date.parse(normalized);
  return Number.isNaN(ms) ? 0 : ms;
}
