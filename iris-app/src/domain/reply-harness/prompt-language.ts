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
    "## Closing voice",
    "Editorial guidance for how the assistant should sound when wrapping up:",
    signature,
    "",
    "Treat this as direction, not a fixed script. Choose the most natural closing for this comment and thread.",
    "Wording may vary — match the spirit and tone, not necessarily the exact phrasing.",
    "If the draft already closes well, keep it or polish lightly.",
    "If the closing feels impersonal or off-brand, refine finalText — do not reject only for that.",
    "A slightly longer, more natural closing may exceed the draft character limit.",
  ].join("\n");
}

export function buildBrandBlock(persona: ReplyPersona): string | null {
  return buildBrandLine(persona);
}

/** @deprecated Use buildBrandBlock in drafts and buildSignatureVerificationBlock in verify. */
export function buildBrandAndSignatureBlock(persona: ReplyPersona): string | null {
  return buildBrandBlock(persona);
}
