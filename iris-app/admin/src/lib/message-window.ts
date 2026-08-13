import type { Message } from "@/lib/types";

const WINDOW_MS = 24 * 60 * 60 * 1000;

export function isWithinMessagingWindow(
  lastInboundTimestamp: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!lastInboundTimestamp) {
    return false;
  }
  const ts = Date.parse(lastInboundTimestamp);
  if (!Number.isFinite(ts)) {
    return false;
  }
  return now - ts <= WINDOW_MS;
}

export function messagingWindowLabel(
  lastInboundTimestamp: string | null | undefined,
): string {
  return isWithinMessagingWindow(lastInboundTimestamp)
    ? "Janela de 24h aberta"
    : "Janela de 24h expirada — resposta pode falhar na Meta";
}

export function lastInboundMessage(messages: Message[]): Message | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.direction === "inbound") {
      return message;
    }
  }
  return null;
}
