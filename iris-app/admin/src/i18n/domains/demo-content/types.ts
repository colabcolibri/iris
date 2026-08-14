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

export type DemoContentMessages = {
  ui: DemoUiMessages;
};
