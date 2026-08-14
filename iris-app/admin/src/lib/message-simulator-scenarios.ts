import type { SimulateThreadMessage } from "@/lib/api";
import { DEMO_BRAND_REPLY_HANDLE } from "@/demo/demo-brand";
import { threadRowsFromMessages } from "@/components/agent-simulator/types";

export type MessageSimulatorScenario = {
  id: string;
  label: string;
  description: string;
  participant_username: string;
  reply_prompt: string | null;
  thread: SimulateThreadMessage[];
  target_author: string;
  target_text: string;
};

export const MESSAGE_SIMULATOR_SCENARIOS: MessageSimulatorScenario[] = [
  {
    id: "product-price",
    label: "Consulta de preço",
    description: "Cliente pergunta valor e disponibilidade de um produto da loja.",
    participant_username: "julia.style",
    reply_prompt: null,
    thread: [
      {
        author: "julia.style",
        text: "Oi! Vi o vestido no stories.",
        is_brand_reply: false,
      },
    ],
    target_author: "julia.style",
    target_text: "Quanto custa o vestido linho areia tamanho M? Vocês entregam pro Sul?",
  },
  {
    id: "product-link",
    label: "Link do produto",
    description: "Pedido direto de link para comprar.",
    participant_username: "camila.fit",
    reply_prompt: "Priorizar link da loja virtual quando citar produto.",
    thread: [],
    target_author: "camila.fit",
    target_text: "Manda o link da bolsa Nômade pra eu comprar?",
  },
  {
    id: "general-thanks",
    label: "Agradecimento",
    description: "Mensagem leve sem consulta de catálogo.",
    participant_username: "marina.mods",
    reply_prompt: null,
    thread: [
      {
        author: DEMO_BRAND_REPLY_HANDLE,
        text: "Obrigada pelo carinho! 💛",
        is_brand_reply: true,
      },
    ],
    target_author: "marina.mods",
    target_text: "Amei a coleção de vocês, parabéns pelo trabalho!",
  },
];

export const DEFAULT_MESSAGE_SIMULATOR_SCENARIO_ID = MESSAGE_SIMULATOR_SCENARIOS[0]!.id;

export function getMessageSimulatorScenario(
  id: string,
): MessageSimulatorScenario | undefined {
  return MESSAGE_SIMULATOR_SCENARIOS.find((scenario) => scenario.id === id);
}

export function findMessageSimulatorScenarioByTarget(
  author: string,
  text: string,
): MessageSimulatorScenario | undefined {
  const normalizedAuthor = author.trim().replace(/^@/, "");
  const normalizedText = text.trim();
  return MESSAGE_SIMULATOR_SCENARIOS.find(
    (scenario) =>
      scenario.target_author.replace(/^@/, "") === normalizedAuthor &&
      scenario.target_text.trim() === normalizedText,
  );
}

export function threadRowsFromMessageScenario(scenario: MessageSimulatorScenario) {
  return threadRowsFromMessages(scenario.thread);
}
