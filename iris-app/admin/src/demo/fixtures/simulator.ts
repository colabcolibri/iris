import type { SimulateReplyResult } from "@/lib/api";
import type { ReplyAudit } from "@/lib/types";
import {
  findSimulatorScenarioByTarget,
  getSimulatorScenario,
  type SimulatorScenario,
} from "@/lib/agent-simulator-scenarios";
import { DEMO_BRAND_NAME, DEMO_STORE_URL } from "@/demo/demo-brand";

export type SimulateRequestBody = {
  target_comment?: { author?: string; text?: string };
  caption?: string | null;
};

function auditForScenario(
  scenario: SimulatorScenario,
  summary: string,
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
        reasoning: "Comentário sobre produto ou loja — dentro do escopo editorial.",
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
        reasoning: `Tom ${DEMO_BRAND_NAME}: acolhedor, objetivo, com CTA para loja quando relevante.`,
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
        reasoning: "Resposta pré-aprovada para demonstração.",
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

const CANNED_BY_SCENARIO: Record<
  string,
  { final_text: string; summary: string }
> = {
  "lookbook-verao": {
    summary: "Reposição do vestido linho P com link para a loja.",
    final_text: `Oi! Sim — repomos o P do vestido linho areia nesta quinta 🙌 Enquanto isso, você pode reservar pelo link da bio (${DEMO_STORE_URL}) que avisamos por DM quando entrar. Qualquer dúvida de medida, chama que a gente te ajuda com o guia do carrossel.
Equipe Estúdio Nômade 💛`,
  },
  "reel-styling": {
    summary: "Prazo de entrega Sul + reforço da experiência da loja.",
    final_text: `Que bom que curtiu a embalagem! 💛 Pro Sul, o prazo médio é 5–8 dias úteis após confirmação do pagamento. Se quiser acompanhar pedidos abertos, use a área do cliente em ${DEMO_STORE_URL} — por lá também dá pra ver novidades da bolsa Nômade e da coleção cápsula.
Equipe Estúdio Nômade`,
  },
};

function buildResult(
  scenario: SimulatorScenario,
  canned: { final_text: string; summary: string },
): SimulateReplyResult {
  return {
    audit: auditForScenario(scenario, canned.summary),
    final_text: canned.final_text,
    terminal_status: "approved",
    reply_tier: "full",
    response_language: "pt-BR",
  };
}

export function resolveDemoSimulateResult(
  body: SimulateRequestBody,
): SimulateReplyResult {
  const author = body.target_comment?.author ?? "";
  const text = body.target_comment?.text ?? "";

  const byTarget = findSimulatorScenarioByTarget(author, text);
  if (byTarget) {
    const canned = CANNED_BY_SCENARIO[byTarget.id];
    if (canned) {
      return buildResult(byTarget, canned);
    }
  }

  const fallback = getSimulatorScenario("lookbook-verao")!;
  const canned = CANNED_BY_SCENARIO["lookbook-verao"]!;
  return buildResult(fallback, canned);
}

export async function demoSimulateWithDelay(
  body: SimulateRequestBody,
): Promise<SimulateReplyResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return resolveDemoSimulateResult(body);
}
