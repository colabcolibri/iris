import type { LlmCompleter } from "../ports/llm-completer.ts";

export type ReplyAgentInput = {
  caption: string | null;
  commentText: string | null;
  authorUsername: string | null;
};

export type ReplyAgentOptions = {
  llm: LlmCompleter;
  tone?: string;
};

export async function generateReply(
  options: ReplyAgentOptions,
  input: ReplyAgentInput,
): Promise<string> {
  const tone = options.tone ?? process.env.IRIS_REPLY_TONE ?? "amigável e profissional";
  const author = input.authorUsername ?? "usuário";
  const comment = input.commentText ?? "";
  const caption = input.caption ?? "";

  const prompt = `Você responde comentários no Instagram em português do Brasil.
Tom: ${tone}.
Legenda do post: ${caption}
Comentário de @${author}: ${comment}

Escreva uma resposta curta, útil e adequada à marca. Sem hashtags. Máximo 500 caracteres.`;

  return options.llm.complete(prompt);
}
