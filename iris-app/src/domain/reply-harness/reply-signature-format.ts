/** Separador entre corpo e assinatura — funciona bem no Instagram. */
export const SIGNATURE_SEPARATOR = "\n.\n";

export function formatReplyWithSignature(body: string, signature: string): string {
  const trimmedBody = body.trimEnd();
  const trimmedSignature = signature.trim();

  if (!trimmedSignature) {
    return trimmedBody;
  }

  if (!trimmedBody) {
    return trimmedSignature;
  }

  return `${trimmedBody}${SIGNATURE_SEPARATOR}${trimmedSignature}`;
}

/** Exibição na UI: corpo e assinatura em parágrafos (sem o ponto isolado do IG). */
export function formatCommentTextForDisplay(text: string): string {
  if (!text.includes(SIGNATURE_SEPARATOR)) {
    return text;
  }
  return text.split(SIGNATURE_SEPARATOR).join("\n\n");
}
