import type { Message } from "./message.ts";

export const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000;

export function canReplyWithinMessagingWindow(
  lastInboundTimestamp: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!lastInboundTimestamp) {
    return false;
  }
  const timestamp = Date.parse(lastInboundTimestamp);
  if (!Number.isFinite(timestamp)) {
    return false;
  }
  return now - timestamp <= MESSAGING_WINDOW_MS;
}

export function findLastInboundTimestamp(messages: Message[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.direction === "inbound") {
      return message.igTimestamp ?? message.createdAt;
    }
  }
  return null;
}

export function canReplyToConversationMessages(messages: Message[]): boolean {
  return canReplyWithinMessagingWindow(findLastInboundTimestamp(messages));
}
