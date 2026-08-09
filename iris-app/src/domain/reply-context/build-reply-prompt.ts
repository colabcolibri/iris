import type { ReplyContext } from "./types.ts";

export function buildReplyPrompt(context: ReplyContext): string {
  const sections: string[] = [];

  const brandLine = context.persona.brandName
    ? `Marca: ${context.persona.brandName}`
    : null;

  sections.push(
    "## Persona",
    context.persona.systemPrompt,
    `Tom: ${context.persona.tone}`,
    brandLine ?? "",
    "",
  );

  if (context.post) {
    sections.push(
      "## Post",
      `Canal: ${context.post.channel}`,
      `Status: ${context.post.status}`,
      `Legenda: ${context.post.caption ?? "(sem legenda)"}`,
      context.post.scheduledAt ? `Agendado: ${context.post.scheduledAt}` : "",
      context.post.publishedAt ? `Publicado: ${context.post.publishedAt}` : "",
      `Assets: ${context.post.assets.length}`,
      "",
    );
  }

  if (context.imageContext.summaries.length > 0) {
    sections.push("## Visual", ...context.imageContext.summaries, "");
  }

  if (context.thread.entries.length > 0) {
    sections.push("## Thread");
    for (const entry of context.thread.entries) {
      const who = entry.isBrandReply
        ? "marca"
        : entry.author
          ? `@${entry.author}`
          : "usuário";
      sections.push(`${who}: ${entry.text ?? ""}`);
    }
    sections.push("");
  }

  const author = context.targetComment.authorUsername ?? "usuário";
  sections.push(
    "## Comentário a responder",
    `@${author}: ${context.targetComment.text ?? ""}`,
    "",
    `Escreva uma resposta curta, útil e adequada à marca. Sem hashtags. Máximo ${context.persona.maxChars} caracteres.`,
  );

  return sections.filter((line) => line !== undefined).join("\n").trim();
}
