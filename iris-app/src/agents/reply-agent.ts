import type { LlmCompleter } from "../ports/llm-completer.ts";
import type { ReplyContextAssemblerDeps } from "../domain/reply-context/reply-context-assembler.ts";
import { assembleReplyContext } from "../domain/reply-context/reply-context-assembler.ts";
import { buildReplyPrompt } from "../domain/reply-context/build-reply-prompt.ts";
import type { ReplyContext } from "../domain/reply-context/types.ts";

export type ReplyAgentInput = {
  caption: string | null;
  commentText: string | null;
  authorUsername: string | null;
};

export type ReplyAgentOptions = {
  llm: LlmCompleter;
  assembler?: ReplyContextAssemblerDeps;
  tone?: string;
};

export async function generateReply(
  options: ReplyAgentOptions,
  input: ReplyAgentInput | { commentId: string } | { prebuiltContext: ReplyContext },
): Promise<string> {
  if ("prebuiltContext" in input) {
    const prompt = buildReplyPrompt(input.prebuiltContext);
    return options.llm.complete(prompt);
  }

  if ("commentId" in input && options.assembler) {
    const context = await assembleReplyContext(input.commentId, options.assembler);
    if (!context) {
      throw new Error("comment not found for reply context");
    }

    const prompt = buildReplyPrompt(context);
    return options.llm.complete(prompt);
  }

  const legacy = input as ReplyAgentInput;
  const tone = options.tone ?? process.env.IRIS_REPLY_TONE ?? "amigável e profissional";
  const author = legacy.authorUsername ?? "usuário";
  const comment = legacy.commentText ?? "";
  const caption = legacy.caption ?? "";

  const prompt = `Você responde comentários no Instagram em português do Brasil.
Tom: ${tone}.
Legenda do post: ${caption}
Comentário de @${author}: ${comment}

Escreva uma resposta curta, útil e adequada à marca. Sem hashtags. Máximo 500 caracteres.`;

  return options.llm.complete(prompt);
}
