import type { ReplyMode } from "../domain/posts/reply-mode.ts";

export type AppSettings = {
  timezone: string;
  replyMode: ReplyMode;
  /** Derivado de replyMode para compatibilidade com API legada. */
  autoReplyEnabled: boolean;
  /** 0 = resposta imediata no próximo tick; 60–3600 = fila com delay (1–60 min em segundos). */
  replyDelaySeconds: number;
  messageReplyMode: ReplyMode;
  messageAutoReplyEnabled: boolean;
  messageReplyDelaySeconds: number;
  /** Intervalo do worker comment-responder e message-responder (presets 3–20 min). */
  agentReplyTickIntervalSeconds: number;
  /** Cadastra mídias novas (poll + webhook lazy) como posts monitored. */
  autoMonitorEnabled: boolean;
  /** Intervalo do poll de mídias recentes (segundos). */
  autoMonitorIntervalSeconds: number;
  updatedAt: string;
};

export type AppSettingsStore = {
  get(): AppSettings | null;
  upsert(input: Omit<AppSettings, "updatedAt"> & { updatedAt?: string }): AppSettings;
};
