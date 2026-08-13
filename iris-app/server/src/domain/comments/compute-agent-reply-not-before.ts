/** 1 minuto — delay mínimo quando fila ativa (UI trabalha em minutos). */
export const REPLY_DELAY_MIN_SECONDS = 60;
/** 60 minutos. */
export const REPLY_DELAY_MAX_SECONDS = 3600;

export function isValidReplyDelaySeconds(value: number): boolean {
  if (!Number.isFinite(value)) {
    return false;
  }
  const rounded = Math.round(value);
  return rounded === 0 || (rounded >= REPLY_DELAY_MIN_SECONDS && rounded <= REPLY_DELAY_MAX_SECONDS);
}

export function normalizeReplyDelaySeconds(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  const rounded = Math.round(value);
  if (rounded < REPLY_DELAY_MIN_SECONDS) {
    return 0;
  }
  return Math.min(REPLY_DELAY_MAX_SECONDS, rounded);
}

export function computeAgentReplyNotBefore(now: Date, delaySeconds: number): string {
  const delay = normalizeReplyDelaySeconds(delaySeconds);
  if (delay <= 0) {
    return now.toISOString();
  }
  return new Date(now.getTime() + delay * 1000).toISOString();
}
