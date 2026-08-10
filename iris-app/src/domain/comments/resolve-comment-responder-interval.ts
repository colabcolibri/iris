/** Poll mais frequente quando o operador ativa fila com delay na UI (Configurações). */
export const COMMENT_RESPONDER_INTERVAL_WITH_DELAY_MS = 15_000;
export const COMMENT_RESPONDER_INTERVAL_IMMEDIATE_MS = 60_000;

export function resolveCommentResponderIntervalMs(replyDelaySeconds: number): number {
  if (replyDelaySeconds > 0) {
    return COMMENT_RESPONDER_INTERVAL_WITH_DELAY_MS;
  }
  return COMMENT_RESPONDER_INTERVAL_IMMEDIATE_MS;
}
