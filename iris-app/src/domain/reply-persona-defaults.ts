import type { ReplyPersona } from "../ports/reply-persona-store.ts";

export function defaultReplyPersona(): ReplyPersona {
  const tone = process.env.IRIS_REPLY_TONE ?? "amigável e profissional";

  return {
    systemPrompt:
      "Você responde comentários no Instagram em português do Brasil em nome da marca.",
    tone,
    brandName: null,
    maxChars: 500,
    updatedAt: new Date().toISOString(),
  };
}
