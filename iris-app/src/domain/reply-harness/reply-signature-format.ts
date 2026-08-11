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
