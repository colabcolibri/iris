import type { DemoContentMessages } from "./types";

export const demoContentEn = {
  ui: {
    banner:
      "Demo mode — explore Iris with sample data, no sign-up required.",
    demoToast: "Demo mode — this action is not saved.",
    exportNotAvailable: "Export is only available in the real admin.",
    languageLabel: "Language",
    agentLoading: "Agent…",
    agentTitle: (label: string) =>
      `Global agent: ${label}. Click to open settings.`,
    agentBadge: (label: string) => `Agent: ${label.toLowerCase()}`,
    instagramDemo: "(demo)",
    replyModeLabels: {
      off: "Off",
      auto: "Automatic",
      draft: "With approval",
    },
  },
} satisfies DemoContentMessages;
