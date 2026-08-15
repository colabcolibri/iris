/** Parse post campaign TTL from admin number input; empty → null (sem limite). */
export function parseAgentActiveDaysInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number.parseInt(trimmed, 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}
