import type { ReplyPersona } from "../../ports/reply-persona-store.ts";
import { resolveResponseLanguage } from "../reply-language/response-languages.ts";

export type LanguageDirectiveOptions = {
  /** When true, instructs the model to return only public reply text. */
  forPublicReply?: boolean;
  /** When true, adds note that JSON metadata may stay in English. */
  includeJsonNote?: boolean;
};

export function buildResponseLanguageDirective(
  persona: ReplyPersona,
  options: LanguageDirectiveOptions = {},
): string {
  const language = resolveResponseLanguage(persona.responseLanguage);
  const lines = [
    "## Response language (MANDATORY)",
    `Every public Instagram reply MUST be written entirely in ${language.llmLabel} (${language.code}).`,
    "Do not switch languages unless you are quoting the commenter's exact words.",
    "Violating the response language is a hard failure.",
  ];

  if (options.forPublicReply) {
    lines.push("Return ONLY the reply text in that language. No JSON. No hashtags.");
  }

  if (options.includeJsonNote) {
    lines.push('JSON fields "reason" and "reasoning" may use brief English operator labels.');
  }

  return lines.join("\n");
}

export function buildBrandLine(persona: ReplyPersona): string | null {
  if (!persona.brandName?.trim()) {
    return null;
  }
  return `Brand: ${persona.brandName.trim()}`;
}

export function buildSignatureVerificationBlock(persona: ReplyPersona): string | null {
  const signature = persona.signatureInstruction?.trim();
  if (!signature) {
    return null;
  }

  return [
    "## Signature",
    "Brand signature rule:",
    signature,
    "",
    "If the draft is missing this signature, do NOT reject for that reason alone.",
    "When approved=true, rewrite finalText so the signature is included.",
    "The character limit does not apply to adding the signature — finalText may be longer than the draft.",
  ].join("\n");
}

export function buildBrandBlock(persona: ReplyPersona): string | null {
  return buildBrandLine(persona);
}

/** @deprecated Use buildBrandBlock in drafts and buildSignatureVerificationBlock in verify. */
export function buildBrandAndSignatureBlock(persona: ReplyPersona): string | null {
  return buildBrandBlock(persona);
}
