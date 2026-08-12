/** Normaliza frase de confirmação destrutiva (UI admin + tools MCP). */
export function normalizeConfirmPhrase(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function confirmPhraseMatches(
  provided: string | undefined,
  expected: string,
): boolean {
  if (!provided) return false;
  return normalizeConfirmPhrase(provided) === normalizeConfirmPhrase(expected);
}
