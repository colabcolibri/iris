import type { SimulateThreadMessage } from "@/lib/api";
import { DEMO_BRAND_REPLY_HANDLE } from "@/demo/demo-brand";
import type { SimulatorThreadRow } from "@/components/agent-simulator/types";

export type SimulatorScenario = {
  id: string;
  label: string;
  description: string;
  caption: string;
  carousel_summary: string;
  thread: SimulateThreadMessage[];
  target_author: string;
  target_text: string;
};

/**
 * Cenários padrão do simulador — Estúdio Nômade (moda, lifestyle, loja virtual).
 * Usados no admin real (com LLM) e no demo (respostas pré-gravadas).
 */
export const SIMULATOR_SCENARIOS: SimulatorScenario[] = [
  {
    id: "lookbook-verao",
    label: "Carrossel — lookbook verão",
    description:
      "Coleção cápsula de verão + pergunta sobre reposição de tamanho na loja.",
    caption:
      "Verão nômade: peças leves em linho e algodão, paleta areia e oliva, feitas pra transitar do home office ao café da tarde. Qual look você levaria numa terça de reuniões?",
    carousel_summary:
      "6 slides: capa da coleção, flat lay de linho, look no rooftop, close de sandália, guia de medidas, CTA para a loja virtual.",
    thread: [
      {
        author: "marina.mods",
        text: "O vestido linho areia ficou perfeito no segundo slide!",
        is_brand_reply: false,
      },
      {
        author: DEMO_BRAND_REPLY_HANDLE,
        text: "Obrigada! Ele foi pensado pra não marcar no calor e combinar com tudo no armário ☀️",
        is_brand_reply: true,
      },
    ],
    target_author: "julia.style",
    target_text:
      "Vocês vão repor o tamanho P do vestido linho areia? Quero comprar antes do fim de semana.",
  },
  {
    id: "reel-styling",
    label: "Reel — 3 jeitos de usar a bolsa Nômade",
    description:
      "Dica de styling com a bolsa Nômade + pergunta sobre entrega da loja.",
    caption:
      "A bolsa Nômade não é só pra notebook: weekend, feira e viagem de carro. Salva esse reel pra montar a mala sem stress.",
    carousel_summary:
      "Reel em 3 cortes: bolsa no café, na feira orgânica, no banco do carro; texto na tela com cada uso.",
    thread: [
      {
        author: "pri.travel",
        text: "Preciso dessa bolsa na minha vida!",
        is_brand_reply: false,
      },
    ],
    target_author: "camila.fit",
    target_text:
      "Qual o prazo de entrega pro Sul? Comprei pela loja virtual mês passado e adorei a embalagem.",
  },
];

export const DEFAULT_SIMULATOR_SCENARIO_ID = SIMULATOR_SCENARIOS[0]!.id;

export function getSimulatorScenario(
  id: string,
): SimulatorScenario | undefined {
  return SIMULATOR_SCENARIOS.find((scenario) => scenario.id === id);
}

export function findSimulatorScenarioByTarget(
  author: string,
  text: string,
): SimulatorScenario | undefined {
  const normalizedAuthor = author.trim().replace(/^@/, "");
  const normalizedText = text.trim();
  return SIMULATOR_SCENARIOS.find(
    (scenario) =>
      scenario.target_author.replace(/^@/, "") === normalizedAuthor &&
      scenario.target_text.trim() === normalizedText,
  );
}

export function threadRowsFromScenario(scenario: SimulatorScenario): SimulatorThreadRow[] {
  return scenario.thread.map((row) => ({
    id: crypto.randomUUID(),
    author: row.author,
    text: row.text,
    is_brand_reply: Boolean(row.is_brand_reply),
  }));
}
