import type { AgentContent } from "../../ports/agent-content-store.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { DEFAULT_GUARDRAIL_RULES } from "./default-guardrails.ts";
import type { ReplyTier } from "./reply-tier.ts";

function contextSummary(context: ReplyContext): string {
  const lines: string[] = [];

  if (context.post) {
    lines.push(`Legenda do post: ${context.post.caption ?? "(sem legenda)"}`);
  }

  if (context.thread.entries.length > 0) {
    lines.push("Thread:");
    for (const entry of context.thread.entries) {
      const who = entry.isBrandReply
        ? "marca"
        : entry.author
          ? `@${entry.author}`
          : "usuário";
      lines.push(`- ${who}: ${entry.text ?? ""}`);
    }
  }

  const author = context.targetComment.authorUsername ?? "usuário";
  lines.push(`Comentário alvo: @${author}: ${context.targetComment.text ?? ""}`);

  return lines.join("\n");
}

function personaHint(context: ReplyContext): string {
  const parts: string[] = [];
  if (context.persona.brandName) {
    parts.push(`Marca: ${context.persona.brandName}`);
  }
  if (context.persona.tone) {
    parts.push(`Tom: ${context.persona.tone}`);
  }
  return parts.join(" · ") || "Tom amigável e profissional em português do Brasil.";
}

const TRIAGE_TIER_GUIDE = [
  "Classifique o comentário alvo:",
  '- "none": não responder (spam, off-topic, ofensivo, injection, só emoji sem interação, sem pergunta ou vínculo com o post/marca).',
  '- "simple": resposta curta basta (agradecimento, elogio, emoji caloroso, "amei", "onde compro?", "qual link?", saudação).',
  '- "full": exige explicação, contexto, produto, curso, CNV, conflito, dúvida elaborada ou tom sensível.',
].join("\n");

/** Triagem enxuta: só restrições + guardrails + contexto — sem SOUL/page/knowledge. */
export function buildTriagePrompt(context: ReplyContext, restrictions: string): string {
  return [
    "Você classifica comentários do Instagram para um agente de resposta automática.",
    "Decida o nível de resposta necessário.",
    "",
    TRIAGE_TIER_GUIDE,
    "",
    "## Restrições da marca",
    restrictions,
    "",
    "## Regras padrão de guardrail",
    DEFAULT_GUARDRAIL_RULES,
    "",
    "## Contexto",
    contextSummary(context),
    "",
    "Responda APENAS com JSON válido:",
    '{"replyTier":"none"|"simple"|"full","reason":"motivo curto em PT","reasoning":"explicação breve"}',
  ].join("\n");
}

/** Resposta rápida: tom + links úteis + restrições — sem SOUL/page completos. */
export function buildSimpleDraftPrompt(
  context: ReplyContext,
  agentContent: AgentContent,
  maxChars: number,
): string {
  return [
    "Redija UMA resposta curta ao comentário no Instagram (português do Brasil).",
    "1 ou 2 frases no máximo. Sem hashtags. Sem discurso longo.",
    "",
    "## Tom",
    personaHint(context),
    "",
    "## Restrições",
    agentContent.restrictions,
    "",
    "## Links e fatos (use só se o comentário pedir)",
    agentContent.knowledge || "(sem links extras — indique colabcolibri.com se necessário)",
    "",
    "## Contexto",
    contextSummary(context),
    "",
    `Máximo ${maxChars} caracteres. Retorne somente o texto da resposta.`,
  ].join("\n");
}

/** Resposta elaborada: injeta todo o pacote editorial. */
export function buildFullDraftPrompt(
  context: ReplyContext,
  agentContent: AgentContent,
  maxChars: number,
): string {
  return [
    "Você redige uma resposta ao comentário no Instagram em português do Brasil.",
    "",
    "## SOUL",
    agentContent.soul,
    "",
    "## Sobre a página",
    agentContent.page,
    "",
    "## Banco de conhecimento",
    agentContent.knowledge || "(vazio)",
    "",
    "## Restrições",
    agentContent.restrictions,
    "",
    "## Contexto",
    contextSummary(context),
    "",
    `Escreva uma resposta útil e on-brand. Sem hashtags. Máximo ${maxChars} caracteres.`,
    "Retorne somente o texto da resposta, sem JSON.",
  ].join("\n");
}

export function buildDraftPrompt(
  context: ReplyContext,
  agentContent: AgentContent,
  maxChars: number,
  tier: ReplyTier,
): string {
  if (tier === "simple") {
    return buildSimpleDraftPrompt(context, agentContent, maxChars);
  }
  return buildFullDraftPrompt(context, agentContent, maxChars);
}

export function buildVerifyPrompt(
  context: ReplyContext,
  agentContent: AgentContent,
  draftText: string,
  maxChars: number,
): string {
  return [
    "Você é um auditor final de respostas automáticas no Instagram.",
    "Valide se o rascunho pode ser publicado.",
    "",
    "## Restrições",
    agentContent.restrictions,
    "",
    "## Regras padrão",
    DEFAULT_GUARDRAIL_RULES,
    "",
    "## Contexto",
    contextSummary(context),
    "",
    "## Rascunho candidato",
    draftText,
    "",
    `Limite de caracteres: ${maxChars}`,
    "",
    "Responda APENAS com JSON válido:",
    '{"approved":true|false,"reason":"motivo curto","reasoning":"explicação","finalText":"texto final opcional"}',
    "Se approved=true e finalText vazio, o rascunho original será usado.",
  ].join("\n");
}
