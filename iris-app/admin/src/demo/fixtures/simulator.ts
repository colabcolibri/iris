import type { SimulateReplyResult } from "@/lib/api";
import type { ReplyAudit } from "@/lib/types";
import type { DemoLocale } from "@/demo/locale";
import {
  findSimulatorScenarioByTarget,
  getSimulatorScenario,
  type SimulatorScenario,
} from "@/lib/agent-simulator-scenarios";
import { DEMO_BRAND_NAME, DEMO_STORE_URL } from "@/demo/demo-brand";
import { getActiveDemoLocale } from "@/demo/demo-state";
import {
  getDemoSimulateCannedEn,
  type DemoSimulateCanned,
} from "@/demo/fixtures/i18n/simulator.en";

export type SimulateRequestBody = {
  target_comment?: { author?: string; text?: string };
  caption?: string | null;
};

function auditForScenario(
  scenario: SimulatorScenario,
  summary: string,
  canned: DemoSimulateCanned,
): ReplyAudit {
  return {
    agent_run_id: `demo-simulate-${scenario.id}`,
    flow_id: "comment-reply",
    trigger: "manual_simulate",
    terminal_status: "approved",
    reply_tier: "full",
    output_summary: summary,
    steps: [
      {
        stage: "triage",
        verdict: "pass",
        reason: null,
        reasoning: canned.triage_reasoning,
        created_at: "2026-08-12T12:00:01.000Z",
        llm: {
          model: "demo-canned",
          promptTokens: 380,
          completionTokens: 14,
          totalTokens: 394,
          latencyMs: 0,
        },
      },
      {
        stage: "draft",
        verdict: "pass",
        reason: null,
        reasoning: canned.draft_reasoning,
        created_at: "2026-08-12T12:00:02.000Z",
        llm: {
          model: "demo-canned",
          promptTokens: 920,
          completionTokens: 68,
          totalTokens: 988,
          latencyMs: 0,
        },
      },
      {
        stage: "verify",
        verdict: "pass",
        reason: null,
        reasoning: canned.verify_reasoning,
        created_at: "2026-08-12T12:00:03.000Z",
        llm: {
          model: "demo-canned",
          promptTokens: 260,
          completionTokens: 8,
          totalTokens: 268,
          latencyMs: 0,
        },
      },
    ],
  };
}

const CANNED_BY_SCENARIO_PT: Record<string, DemoSimulateCanned> = {
  "lookbook-verao": {
    summary: "Reposição do vestido linho P com link para a loja.",
    final_text: `Oi! Sim — repomos o P do vestido linho areia nesta quinta 🙌 Enquanto isso, você pode reservar pelo link da bio (${DEMO_STORE_URL}) que avisamos por DM quando entrar. Qualquer dúvida de medida, chama que a gente te ajuda com o guia do carrossel.
Equipe Estúdio Nômade 💛`,
    triage_reasoning:
      "Comentário sobre produto ou loja — dentro do escopo editorial.",
    draft_reasoning: `Tom ${DEMO_BRAND_NAME}: acolhedor, objetivo, com CTA para loja quando relevante.`,
    verify_reasoning: "Resposta pré-aprovada para demonstração.",
  },
  "reel-styling": {
    summary: "Prazo de entrega Sul + reforço da experiência da loja.",
    final_text: `Que bom que curtiu a embalagem! 💛 Pro Sul, o prazo médio é 5–8 dias úteis após confirmação do pagamento. Se quiser acompanhar pedidos abertos, use a área do cliente em ${DEMO_STORE_URL} — por lá também dá pra ver novidades da bolsa Nômade e da coleção cápsula.
Equipe Estúdio Nômade`,
    triage_reasoning:
      "Comentário sobre produto ou loja — dentro do escopo editorial.",
    draft_reasoning: `Tom ${DEMO_BRAND_NAME}: acolhedor, objetivo, com CTA para loja quando relevante.`,
    verify_reasoning: "Resposta pré-aprovada para demonstração.",
  },
};

export function getDemoSimulateCanned(
  locale: DemoLocale,
): Record<string, DemoSimulateCanned> {
  return locale === "en" ? getDemoSimulateCannedEn() : CANNED_BY_SCENARIO_PT;
}

function buildResult(
  scenario: SimulatorScenario,
  canned: DemoSimulateCanned,
  locale: DemoLocale,
): SimulateReplyResult {
  return {
    audit: auditForScenario(scenario, canned.summary, canned),
    final_text: canned.final_text,
    terminal_status: "approved",
    reply_tier: "full",
    response_language: locale === "en" ? "en" : "pt-BR",
  };
}

export function resolveDemoSimulateResult(
  body: SimulateRequestBody,
  locale?: DemoLocale,
): SimulateReplyResult {
  const activeLocale = locale ?? getActiveDemoLocale();
  const cannedByScenario = getDemoSimulateCanned(activeLocale);
  const author = body.target_comment?.author ?? "";
  const text = body.target_comment?.text ?? "";

  const byTarget = findSimulatorScenarioByTarget(author, text);
  if (byTarget) {
    const canned = cannedByScenario[byTarget.id];
    if (canned) {
      return buildResult(byTarget, canned, activeLocale);
    }
  }

  const fallback = getSimulatorScenario("lookbook-verao")!;
  const canned = cannedByScenario["lookbook-verao"]!;
  return buildResult(fallback, canned, activeLocale);
}

export async function demoSimulateWithDelay(
  body: SimulateRequestBody,
): Promise<SimulateReplyResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return resolveDemoSimulateResult(body);
}
