import type { DemoLocale } from "@/demo/locale";
import type { ReplyMode } from "@/lib/types";

export type DemoUiMessages = {
  banner: string;
  demoToast: string;
  exportNotAvailable: string;
  languageLabel: string;
  agentLoading: string;
  agentTitle: (label: string) => string;
  agentBadge: (label: string) => string;
  instagramDemo: string;
  replyModeLabels: Record<ReplyMode, string>;
};

const MESSAGES: Record<DemoLocale, DemoUiMessages> = {
  pt: {
    banner:
      "Modo demonstração — explore o Iris com dados fictícios, sem cadastro.",
    demoToast: "Modo demonstração — esta ação não é salva.",
    exportNotAvailable: "Exportação disponível apenas no admin real.",
    languageLabel: "Idioma",
    agentLoading: "Agente…",
    agentTitle: (label) => `Agente global: ${label}. Clique para abrir configurações.`,
    agentBadge: (label) => `Agente: ${label.toLowerCase()}`,
    instagramDemo: "(demo)",
    replyModeLabels: {
      off: "Desligado",
      auto: "Automático",
      draft: "Com aprovação",
    },
  },
  en: {
    banner:
      "Demo mode — explore Iris with sample data, no sign-up required.",
    demoToast: "Demo mode — this action is not saved.",
    exportNotAvailable: "Export is only available in the real admin.",
    languageLabel: "Language",
    agentLoading: "Agent…",
    agentTitle: (label) => `Global agent: ${label}. Click to open settings.`,
    agentBadge: (label) => `Agent: ${label.toLowerCase()}`,
    instagramDemo: "(demo)",
    replyModeLabels: {
      off: "Off",
      auto: "Automatic",
      draft: "With approval",
    },
  },
};

export function getDemoUiMessages(locale: DemoLocale): DemoUiMessages {
  return MESSAGES[locale];
}
