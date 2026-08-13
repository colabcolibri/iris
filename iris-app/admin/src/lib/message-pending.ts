import type { Message } from "@/lib/types";

export function countPendingInboundMessages(messages: Message[]): number {
  return messages.filter(
    (message) => message.direction === "inbound" && message.status === "pending",
  ).length;
}

export function latestPendingInboundMessage(messages: Message[]): Message | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.direction === "inbound" && message.status === "pending") {
      return message;
    }
  }
  return null;
}
