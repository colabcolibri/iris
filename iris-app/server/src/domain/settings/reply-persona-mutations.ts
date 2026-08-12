import { ValidationError } from "../../api/json.ts";
import { isSupportedResponseLanguage } from "../reply-language/response-languages.ts";
import type { ReplyPersona } from "../../ports/reply-persona-store.ts";
import { defaultReplyPersona } from "./reply-persona-defaults.ts";

export function serializePersona(persona: ReplyPersona) {
  return {
    brand_name: persona.brandName,
    signature_instruction: persona.signatureInstruction,
    response_language: persona.responseLanguage,
    max_chars: persona.maxChars,
    updated_at: persona.updatedAt,
  };
}

export function getReplyPersonaPayload(
  store: { get(): ReplyPersona | null },
): ReturnType<typeof serializePersona> {
  const stored = store.get();
  if (stored) {
    return serializePersona(stored);
  }

  const defaults = defaultReplyPersona();
  return {
    ...serializePersona(defaults),
    updated_at: null,
  };
}

export function normalizePersonaBody(body: Record<string, unknown>): Omit<ReplyPersona, "updatedAt"> {
  const responseLanguage =
    typeof body.response_language === "string" ? body.response_language.trim() : "";

  if (!responseLanguage || !isSupportedResponseLanguage(responseLanguage)) {
    throw new ValidationError("response_language is invalid");
  }

  const maxCharsRaw = body.max_chars;
  const maxChars =
    typeof maxCharsRaw === "number"
      ? maxCharsRaw
      : typeof maxCharsRaw === "string"
        ? Number(maxCharsRaw)
        : NaN;

  if (!Number.isInteger(maxChars) || maxChars < 100 || maxChars > 1000) {
    throw new ValidationError("max_chars must be an integer between 100 and 1000");
  }

  const brandName =
    body.brand_name === null
      ? null
      : typeof body.brand_name === "string"
        ? body.brand_name.trim() || null
        : undefined;

  if (brandName === undefined) {
    throw new ValidationError("brand_name must be a string or null");
  }

  const signatureInstruction =
    typeof body.signature_instruction === "string"
      ? body.signature_instruction
      : body.signature_instruction === undefined
        ? ""
        : undefined;

  if (signatureInstruction === undefined) {
    throw new ValidationError("signature_instruction must be a string");
  }

  if (signatureInstruction.length > 2000) {
    throw new ValidationError("signature_instruction exceeds 2000 characters");
  }

  return {
    brandName,
    signatureInstruction,
    responseLanguage,
    maxChars,
  };
}

export function mergePartialPersonaBody(
  current: ReplyPersona,
  partial: Record<string, unknown>,
): Record<string, unknown> {
  return {
    brand_name: partial.brand_name !== undefined ? partial.brand_name : current.brandName,
    signature_instruction:
      partial.signature_instruction !== undefined
        ? partial.signature_instruction
        : current.signatureInstruction,
    response_language:
      partial.response_language !== undefined ? partial.response_language : current.responseLanguage,
    max_chars: partial.max_chars !== undefined ? partial.max_chars : current.maxChars,
  };
}

export function resolvePersonaForPartialUpdate(
  store: { get(): ReplyPersona | null },
): ReplyPersona {
  return store.get() ?? defaultReplyPersona();
}
