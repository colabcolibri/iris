import type { ReplyMode } from "./reply-mode.ts";

export type AppSettings = {
  timezone: string;
  replyMode: ReplyMode;
  /** Derivado de replyMode para compatibilidade com API legada. */
  autoReplyEnabled: boolean;
  /** 0 = resposta imediata no próximo tick; 30–600 = fila com delay em segundos. */
  replyDelaySeconds: number;
  updatedAt: string;
};

export type AppSettingsStore = {
  get(): AppSettings | null;
  upsert(input: Omit<AppSettings, "updatedAt"> & { updatedAt?: string }): AppSettings;
};
