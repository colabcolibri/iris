import type { AppContext } from "../../app-context.ts";
import type { Conversation } from "../../../domain/messages/conversation.ts";
import { serializeConversation } from "../../../domain/messages/serialize-conversation.ts";
import { canReplyToConversationMessages } from "../../../domain/messages/meta-rules.ts";

export function serializeConversationSummary(
  conversation: Conversation,
  ctx: AppContext,
  messagesForWindow?: ReturnType<AppContext["messages"]["listByConversationId"]>,
) {
  const messages =
    messagesForWindow ?? ctx.messages.listByConversationId(conversation.id);
  return {
    ...serializeConversation(conversation),
    pending_count: ctx.messages.countPendingByConversation(conversation.id),
    can_reply: canReplyToConversationMessages(messages),
  };
}
