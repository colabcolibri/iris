import type { DemoContentMessages } from "./types";

export const demoContentPt = {
  ui: {
    banner:
      "Modo demonstração — explore o Iris com dados fictícios, sem cadastro.",
    demoToast: "Modo demonstração — esta ação não é salva.",
    exportNotAvailable: "Exportação disponível apenas no admin real.",
    languageLabel: "Idioma",
    agentLoading: "Agente…",
    agentTitle: (label: string) =>
      `Agente global: ${label}. Clique para abrir configurações.`,
    agentBadge: (label: string) => `Agente: ${label.toLowerCase()}`,
    instagramDemo: "(demo)",
    replyModeLabels: {
      off: "Desligado",
      auto: "Automático",
      draft: "Com aprovação",
    },
  },
} satisfies DemoContentMessages;
