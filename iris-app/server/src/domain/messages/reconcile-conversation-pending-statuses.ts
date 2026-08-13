import type { MessageRepository } from "../../ports/message-repository.ts";

/** Inbound anteriores à última resposta da marca deixam de contar como pendentes. */
export function reconcileConversationPendingStatuses(
  conversationId: string,
  messages: MessageRepository,
): number {
  const thread = messages.listByConversationId(conversationId);
  if (thread.length === 0) {
    return 0;
  }

  let lastOutboundIndex = -1;
  for (let index = 0; index < thread.length; index += 1) {
    if (thread[index]?.direction === "outbound") {
      lastOutboundIndex = index;
    }
  }

  let marked = 0;
  for (let index = 0; index < thread.length; index += 1) {
    const message = thread[index];
    if (
      !message ||
      message.direction !== "inbound" ||
      message.status !== "pending" ||
      index > lastOutboundIndex
    ) {
      continue;
    }

    messages.markReplied(message.id);
    marked += 1;
  }

  return marked;
}
