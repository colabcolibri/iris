import type { MessageAgentContent } from "../../ports/message-agent-content-store.ts";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import type { MessageCategory } from "./message-category.ts";

function formatProducts(context: MessageReplyContext): string {
  if (context.products.length === 0) {
    return "(nenhum produto cadastrado)";
  }

  return context.products
    .map(
      (product) =>
        `- slug: ${product.slug}\n  nome: ${product.name}\n  resumo: ${product.shortDescription}`,
    )
    .join("\n");
}

function formatThread(context: MessageReplyContext): string {
  if (context.thread.entries.length === 0) {
    return "(sem histórico)";
  }

  return context.thread.entries
    .map((entry) => {
      const author =
        entry.direction === "outbound"
          ? context.brandUsername ?? "marca"
          : entry.authorUsername ?? context.conversation.participantUsername ?? "usuário";
      return `[${entry.direction}] ${author}: ${entry.text}`;
    })
    .join("\n");
}

export function buildMessageTriagePrompt(
  context: MessageReplyContext,
  restrictions: string,
): string {
  return [
    "Você é o estágio de triagem de DMs do Instagram.",
    "Classifique a última mensagem inbound e indique se deve responder.",
    "Categorias válidas: product_inquiry, general_unclear, appreciation_sharing, conversation_sharter, harmful, advice_help.",
    "Em DM a Íris sempre responde, exceto harmful (shouldReply=false).",
    "Se product_inquiry, preencha productSlug quando identificar um produto da lista.",
    "Responda APENAS JSON:",
    '{"messageCategory":"...","productSlug":null,"shouldReply":true,"reason":"...","reasoning":"..."}',
    "",
    `Persona marca: ${context.persona.brandName ?? "(sem nome)"}`,
    `Idioma: ${context.persona.responseLanguage}`,
    "",
    "Produtos ativos:",
    formatProducts(context),
    "",
    "Thread:",
    formatThread(context),
    "",
    "Mensagem alvo:",
    context.targetMessage.text ?? "(vazio)",
    "",
    "Restrições:",
    restrictions || "(nenhuma)",
    context.conversation.replyPrompt
      ? `\nBriefing da conversa:\n${context.conversation.replyPrompt}`
      : "",
  ].join("\n");
}

export function buildMessageDraftPrompt(
  context: MessageReplyContext,
  agentContent: MessageAgentContent,
  maxChars: number,
  category: MessageCategory,
): string {
  return [
    "Você redige a resposta em DM do Instagram.",
    `Categoria triada: ${category}`,
    `Limite: ${maxChars} caracteres.`,
    "Responda só com o texto final da mensagem, sem JSON.",
    "",
    "Alma (dm_soul):",
    agentContent.dmSoul || "(vazio)",
    "",
    "Página (dm_page):",
    agentContent.dmPage || "(vazio)",
    "",
    "Conhecimento (dm_knowledge):",
    agentContent.dmKnowledge || "(vazio)",
    "",
    "Restrições:",
    agentContent.dmRestrictions || "(nenhuma)",
    "",
    "Produtos:",
    formatProducts(context),
    "",
    "Thread:",
    formatThread(context),
    "",
    "Mensagem a responder:",
    context.targetMessage.text ?? "(vazio)",
    context.conversation.replyPrompt
      ? `\nBriefing da conversa:\n${context.conversation.replyPrompt}`
      : "",
  ].join("\n");
}

export function buildMessageVerifyPrompt(
  context: MessageReplyContext,
  agentContent: MessageAgentContent,
  draftText: string,
  maxChars: number,
): string {
  return [
    "Verifique o rascunho de DM antes do envio.",
    "Responda APENAS JSON:",
    '{"approved":true,"harmful":false,"policyViolations":[],"reason":"...","reasoning":"...","finalText":"..."}',
    "",
    `Limite: ${maxChars} caracteres.`,
    "",
    "Restrições:",
    agentContent.dmRestrictions || "(nenhuma)",
    "",
    "Thread:",
    formatThread(context),
    "",
    "Rascunho:",
    draftText,
  ].join("\n");
}
