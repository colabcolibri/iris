import type { ReplyPersona } from "../../ports/reply-persona-store.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { resolveResponseLanguage } from "../reply-language/response-languages.ts";
import { SIGNATURE_SEPARATOR } from "./reply-signature-format.ts";

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

/** Handle do Instagram do autor do comentário-alvo, sem @. */
export function resolveTargetMentionHandle(context: ReplyContext): string | null {
  const raw = context.targetComment.authorUsername?.trim().replace(/^@+/, "");
  if (!raw || raw.toLowerCase() === "user") {
    return null;
  }
  return raw;
}

/** Diretiva para taguear o autor com @ no corpo da resposta (não na assinatura). */
export function buildMentionDirective(context: ReplyContext): string | null {
  const handle = resolveTargetMentionHandle(context);
  if (!handle) {
    return null;
  }

  return [
    "## Mention the commenter (MANDATORY)",
    `Instagram handle: @${handle}`,
    `Include @${handle} in the reply body so they get notified — weave it in naturally (e.g. opening or mid-sentence).`,
    "One @mention is enough. Sound human, not like a template.",
    "Put the @mention in the main message — not only in a closing signature or sign-off.",
  ].join("\n");
}

export function buildMentionVerifyNote(context: ReplyContext): string | null {
  const handle = resolveTargetMentionHandle(context);
  if (!handle) {
    return null;
  }

  return [
    `The commenter's handle is @${handle}.`,
    `finalText should include @${handle} in the reply body (not only in the sign-off).`,
    "If the draft omitted it, add it naturally when polishing.",
  ].join(" ");
}

export function buildTriageAudienceDirective(context: ReplyContext): string {
  const brandHandle = context.brandUsername?.trim().replace(/^@+/, "");
  const brandLabel = context.persona.brandName?.trim();

  const lines = [
    "## Reply audience (MANDATORY)",
    "Decide whether the TARGET comment expects a reply from the brand account.",
    "Read the thread chronologically; @mentions show who each message addresses.",
  ];

  if (brandHandle) {
    lines.push(`Brand Instagram handle: @${brandHandle}`);
  }
  if (brandLabel) {
    lines.push(`Brand display name: ${brandLabel}`);
  }

  lines.push(
    "Use conversational intent from the full thread — not @mentions alone.",
    "An @mention of the brand does NOT automatically mean the comment is for the brand (it may be accidental, quoted, or secondary while the message is really for someone else).",
    "The target may be for the brand even with NO @mention — e.g. a question on the brand's post, thanks/praise aimed at the page, or a direct reply to the brand's last message in the thread.",
    "Reply when the target clearly expects the brand to respond.",
    "Do NOT reply when the target is mainly for another participant — even if the brand handle appears incidentally.",
    "Signals the brand IS addressed: question or thanks clearly aimed at the brand/page, continuing an exchange where the brand spoke last, or content that only the brand can answer.",
    "Signals the brand is NOT addressed: reply to another user's handle, side conversation between followers, answer meant for another commenter, agreement with someone else (@other_user …), banter that does not invite the brand.",
    'If not for the brand: shouldReply=false, replyTier="none", blockCategory="not_for_brand".',
  );

  return lines.join("\n");
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
    "The closing is OPTIONAL: skip it entirely when the reply already sounds complete and on-brand.",
    "Never repeat name, role, or bot identity twice in the same reply.",
    "If the draft already established who is speaking or the assistant's role, do NOT add a trailing sign-off that repeats the same information.",
    "In that case, keep the body as-is or polish lightly — no redundant footer.",
    "When you do add a closing, separate it from the main reply using this Instagram-friendly layout:",
    "1) Main reply body (normal sentences; do not end the body with a lone period on its own line).",
    "2) A single period character on its own line.",
    "3) The sign-off line (name, team, emoji — per the editorial guidance above).",
    `Use this exact separator between body and sign-off: newline + "." + newline (${JSON.stringify(SIGNATURE_SEPARATOR)}).`,
    "Do NOT use a blank line alone (\\n\\n) between body and sign-off.",
    "Example finalText:",
    "Obrigado pelo comentário, @maria!",
    ".",
    "— Equipe Iris",
    "Never glue the sign-off to the last sentence of the body in the same paragraph.",
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
