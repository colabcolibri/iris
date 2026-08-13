import { ValidationError } from "../../api/json.ts";
import type { MessageRepository } from "../../ports/message-repository.ts";
import { canReplyToConversationMessages } from "./meta-rules.ts";

export function assertCanReplyToConversation(
  messages: MessageRepository,
  conversationId: string,
): void {
  const thread = messages.listByConversationId(conversationId);
  if (!canReplyToConversationMessages(thread)) {
    throw new ValidationError(
      "messaging window expired — Meta only allows replies within 24h of the last inbound message",
    );
  }
}
