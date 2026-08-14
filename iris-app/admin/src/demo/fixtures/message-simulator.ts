import type { SimulateReplyResult } from "@/lib/api";
import type { ReplyAudit } from "@/lib/types";
import type { DemoLocale } from "@/demo/locale";
import {
  findMessageSimulatorScenarioByTarget,
  getMessageSimulatorScenario,
  type MessageSimulatorScenario,
} from "@/lib/message-simulator-scenarios";
import { DEMO_BRAND_NAME, DEMO_STORE_URL } from "@/demo/demo-brand";
import { getActiveDemoLocale } from "@/demo/demo-state";
import { DEFAULT_RESPONSE_LANGUAGE } from "@iris/domain/reply-language/response-languages";

export type DemoMessageSimulateRequestBody = {
  channel?: "dm" | "comment";
  target_message?: { author?: string; text?: string };
  response_language?: string;
};

type DemoMessageCanned = {
  summary: string;
  final_text: string;
  triage_reasoning: string;
  draft_reasoning: string;
  verify_reasoning: string;
};

function auditForMessageScenario(
  scenario: MessageSimulatorScenario,
  summary: string,
  canned: DemoMessageCanned,
): ReplyAudit {
  return {
    agent_run_id: `demo-msg-sim-${scenario.id}`,
    flow_id: "message-reply",
    trigger: "manual_simulate",
    terminal_status: "approved",
    reply_tier: "full",
    output_summary: summary,
    session_summary: {
      stepCount: 5,
      llmCallCount: 3,
      toolCallCount: 1,
      totalPromptTokens: 1240,
      totalCompletionTokens: 180,
      totalTokens: 1420,
      totalLatencyMs: 2100,
      durationMs: 2200,
      models: ["demo-canned"],
    },
    steps: [
      {
        stage: "message_triage",
        verdict: "pass",
        reason: "category:product_inquiry",
        reasoning: canned.triage_reasoning,
        created_at: "2026-08-14T12:00:01.000Z",
        step_kind: "llm",
        llm: {
          model: "demo-canned",
          promptTokens: 320,
          completionTokens: 24,
          totalTokens: 344,
          latencyMs: 400,
        },
      },
      {
        stage: "tool_call",
        verdict: "pass",
        reason: "tool:search_products",
        reasoning: null,
        created_at: "2026-08-14T12:00:02.000Z",
        step_kind: "tool",
        tool_name: "search_products",
        tool_input: { query: "vestido linho" },
        tool_output: { items: [{ slug: "vestido-linho-areia", price: "R$ 189,00" }] },
        tool_latency_ms: 35,
      },
      {
        stage: "message_draft_turn",
        verdict: "pass",
        reason: "draft_turn:0",
        reasoning: canned.draft_reasoning,
        created_at: "2026-08-14T12:00:03.000Z",
        step_kind: "llm",
        llm: {
          model: "demo-canned",
          promptTokens: 520,
          completionTokens: 96,
          totalTokens: 616,
          latencyMs: 900,
        },
      },
      {
        stage: "message_verify",
        verdict: "pass",
        reason: "approved",
        reasoning: canned.verify_reasoning,
        created_at: "2026-08-14T12:00:04.000Z",
        step_kind: "llm",
        llm: {
          model: "demo-canned",
          promptTokens: 400,
          completionTokens: 60,
          totalTokens: 460,
          latencyMs: 500,
        },
      },
    ],
  };
}

const CANNED_BY_SCENARIO_PT: Record<string, DemoMessageCanned> = {
  "product-price": {
    summary: "Preço e entrega do vestido linho areia.",
    final_text: `Oi! O vestido linho areia sai por R$ 189 no tamanho M 💛 Entregamos pro Sul em 5–8 dias úteis. Se quiser garantir, é só comprar em ${DEMO_STORE_URL} — qualquer dúvida de medida, me chama!
${DEMO_BRAND_NAME}`,
    triage_reasoning: "Pergunta de produto e entrega — product_inquiry.",
    draft_reasoning: "Consultou catálogo via search_products antes de responder.",
    verify_reasoning: "Preço e prazo coerentes com product_facts.",
  },
  "product-link": {
    summary: "Link direto do Jogo Grok.",
    final_text: `Claro! O Jogo Grok está aqui: ${DEMO_STORE_URL}/jogo-grok — se precisar de ajuda com frete, é só falar 💛`,
    triage_reasoning: "Pedido de link de produto.",
    draft_reasoning: "Consultou catálogo e retornou URL da loja.",
    verify_reasoning: "Link válido para demo.",
  },
  "purchase-difficulty": {
    summary: "Escalação por dificuldade no checkout.",
    final_text:
      "Entendo a frustração — vou pedir para nossa equipe verificar o checkout e te retorno em breve por aqui.",
    triage_reasoning: "purchase_difficulty detectado na triagem.",
    draft_reasoning: "notify_operator com customerMessage em português.",
    verify_reasoning: "Escalação registrada; resposta ao cliente aprovada.",
  },
  "general-thanks": {
    summary: "Agradecimento caloroso sem CTA de venda.",
    final_text: `Que mensagem linda — obrigada de coração! Ficamos muito felizes que a coleção tenha chegado aí 💛`,
    triage_reasoning: "Apreciação sem consulta de catálogo.",
    draft_reasoning: "Tom acolhedor, sem tools.",
    verify_reasoning: "Sem fatos de produto a validar.",
  },
};

const CANNED_BY_SCENARIO_EN: Record<string, DemoMessageCanned> = {
  "product-price": {
    summary: "Linen dress price and shipping.",
    final_text: `Hi! The sand linen dress is $189 in size M 💛 We ship to the South region in 5–8 business days. You can buy here: ${DEMO_STORE_URL} — message us if you need sizing help!
${DEMO_BRAND_NAME}`,
    triage_reasoning: "Product and shipping question — product_inquiry.",
    draft_reasoning: "Used search_products before replying.",
    verify_reasoning: "Price and timeline match product_facts.",
  },
  "product-link": {
    summary: "Direct Grok Game link.",
    final_text: `Sure! Here is the Grok Game: ${DEMO_STORE_URL}/jogo-grok — let us know if you need help with shipping 💛`,
    triage_reasoning: "Direct product link request.",
    draft_reasoning: "Catalog lookup returned store URL.",
    verify_reasoning: "Valid demo link.",
  },
  "purchase-difficulty": {
    summary: "Escalation after checkout difficulty.",
    final_text:
      "I understand how frustrating that is — I'll ask our team to review checkout and get back to you here shortly.",
    triage_reasoning: "purchase_difficulty detected in triage.",
    draft_reasoning: "notify_operator with English customerMessage.",
    verify_reasoning: "Escalation logged; customer reply approved.",
  },
  "general-thanks": {
    summary: "Warm thank-you without sales CTA.",
    final_text: `What a lovely message — thank you so much! We're thrilled the collection reached you 💛`,
    triage_reasoning: "Appreciation without catalog lookup.",
    draft_reasoning: "Warm tone, no tools.",
    verify_reasoning: "No product facts to validate.",
  },
};

function resolveSimulateResponseLanguage(
  body: DemoMessageSimulateRequestBody,
  fallbackLocale: DemoLocale,
): string {
  const requested = body.response_language?.trim();
  if (requested) {
    return requested;
  }
  return fallbackLocale === "en" ? "en-US" : DEFAULT_RESPONSE_LANGUAGE;
}

function isEnglishResponseLanguage(code: string): boolean {
  return code.toLowerCase().startsWith("en");
}

export function resolveDemoMessageSimulateResult(
  body: DemoMessageSimulateRequestBody,
  locale?: DemoLocale,
): SimulateReplyResult {
  const activeLocale = locale ?? getActiveDemoLocale();
  const responseLanguage = resolveSimulateResponseLanguage(body, activeLocale);
  const author = body.target_message?.author ?? "";
  const text = body.target_message?.text ?? "";

  const byTarget = findMessageSimulatorScenarioByTarget(author, text);
  const scenario = byTarget ?? getMessageSimulatorScenario("product-price")!;
  const cannedByLanguage = isEnglishResponseLanguage(responseLanguage)
    ? CANNED_BY_SCENARIO_EN
    : CANNED_BY_SCENARIO_PT;
  const canned = cannedByLanguage[scenario.id] ?? cannedByLanguage["product-price"]!;

  return {
    audit: auditForMessageScenario(scenario, canned.summary, canned),
    final_text: canned.final_text,
    terminal_status: "approved",
    reply_tier: "full",
    response_language: responseLanguage,
  };
}

export async function demoMessageSimulateWithDelay(
  body: DemoMessageSimulateRequestBody,
): Promise<SimulateReplyResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return resolveDemoMessageSimulateResult(body);
}
