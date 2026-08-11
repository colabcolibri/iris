import { readJsonBody, sendJson, ValidationError } from "../json.ts";
import { createAdminPathRouter } from "../router.ts";
import { defaultReplyPersona } from "../../domain/reply-persona-defaults.ts";
import { isSupportedResponseLanguage } from "../../domain/reply-language/response-languages.ts";
import type { ReplyPersona } from "../../ports/reply-persona-store.ts";

function serializePersona(persona: ReplyPersona) {
  return {
    brand_name: persona.brandName,
    signature_instruction: persona.signatureInstruction,
    response_language: persona.responseLanguage,
    max_chars: persona.maxChars,
    updated_at: persona.updatedAt,
  };
}

function normalizePersonaBody(body: Record<string, unknown>): Omit<ReplyPersona, "updatedAt"> {
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

export const handleSettingsRoute = createAdminPathRouter("/api/settings/reply-persona", {
  GET: async (match) => {
    const stored = match.ctx.replyPersonaStore.get();
    if (stored) {
      sendJson(match.res, 200, serializePersona(stored));
      return;
    }

    const defaults = defaultReplyPersona();
    sendJson(match.res, 200, {
      ...serializePersona(defaults),
      updated_at: null,
    });
  },
  PUT: async (match) => {
    const body = await readJsonBody<Record<string, unknown>>(match.req);
    const input = normalizePersonaBody(body);
    const saved = match.ctx.replyPersonaStore.upsert(input);
    sendJson(match.res, 200, serializePersona(saved));
  },
});
