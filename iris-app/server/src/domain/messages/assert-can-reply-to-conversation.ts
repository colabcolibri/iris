import { ValidationError } from "../../api/json.ts";
import { ErrorCodes } from "../errors/error-codes.ts";
import type { MessageRepository } from "../../ports/message-repository.ts";
import { canReplyToConversationMessages } from "./meta-rules.ts";

export function assertCanReplyToConversation(
  messages: MessageRepository,
  conversationId: string,
): void {
  const thread = messages.listByConversationId(conversationId);
  if (!canReplyToConversationMessages(thread)) {
    throw new ValidationError(ErrorCodes.MESSAGING_WINDOW_EXPIRED);
  }
}
