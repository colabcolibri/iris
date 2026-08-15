import type { ReplyMode } from "../domain/posts/reply-mode.ts";
import type { PrivateReplyMode } from "../domain/posts/private-reply-mode.ts";
import type { ServerAppLocale } from "../i18n/locale.ts";

export type AppSettings = {
  timezone: string;
  adminLocale: ServerAppLocale;
  replyMode: ReplyMode;
  /** Derivado de replyMode para compatibilidade com API legada. */
  autoReplyEnabled: boolean;
  /** 0 = resposta imediata no próximo tick; 60–3600 = fila com delay (1–60 min em segundos). */
  replyDelaySeconds: number;
  /** Comentários mais antigos que este limite não entram na fila do agente. */
  replyMaxAgeDays: number;
  /** Private reply global (inherit nos posts). */
  privateReplyMode: PrivateReplyMode;
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
