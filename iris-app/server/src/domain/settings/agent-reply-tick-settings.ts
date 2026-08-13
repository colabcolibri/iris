/** Intervalo padrão do worker de resposta: 5 minutos. */
export const AGENT_REPLY_TICK_INTERVAL_DEFAULT_SECONDS = 300;

export const AGENT_REPLY_TICK_PRESETS_SECONDS = [180, 300, 600, 900, 1200] as const;

export type AgentReplyTickPresetSeconds =
  (typeof AGENT_REPLY_TICK_PRESETS_SECONDS)[number];

export function isValidAgentReplyTickIntervalSeconds(value: number): boolean {
  if (!Number.isFinite(value)) {
    return false;
  }
  const rounded = Math.round(value);
  return (AGENT_REPLY_TICK_PRESETS_SECONDS as readonly number[]).includes(rounded);
}

export function normalizeAgentReplyTickIntervalSeconds(value: number): number {
  const rounded = Math.round(value);
  if (isValidAgentReplyTickIntervalSeconds(rounded)) {
    return rounded;
  }
  return AGENT_REPLY_TICK_INTERVAL_DEFAULT_SECONDS;
}
