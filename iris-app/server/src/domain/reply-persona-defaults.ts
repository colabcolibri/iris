import type { ReplyPersona } from "../ports/reply-persona-store.ts";
import { DEFAULT_RESPONSE_LANGUAGE } from "./reply-language/response-languages.ts";

export function defaultReplyPersona(): ReplyPersona {
  return {
    brandName: null,
    signatureInstruction: "",
    responseLanguage: DEFAULT_RESPONSE_LANGUAGE,
    maxChars: 500,
    updatedAt: new Date().toISOString(),
  };
}
