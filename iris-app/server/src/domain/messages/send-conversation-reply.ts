import { randomUUID } from "node:crypto";
import type { ConversationRepository } from "../../ports/conversation-repository.ts";
import type { MessageRepository } from "../../ports/message-repository.ts";
import type { MetaConversationsReader } from "../../ports/meta-conversations-reader.ts";
import type { MetaMessageSender } from "../../ports/meta-message-sender.ts";
import type { Message } from "./message.ts";
import { assertCanReplyToConversation } from "./assert-can-reply-to-conversation.ts";
import { resolveMessageRecipientForSend } from "./resolve-message-recipient.ts";

export type SendConversationReplyDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  metaMessageSender: MetaMessageSender;
  metaConversationsReader: MetaConversationsReader;
  ownerIgUserId: string | null;
  ownerUsername: string | null;
};

export type SendConversationReplyInput = {
  conversationId: string;
  text: string;
  replyToMessageId?: string | null;
};

export async function sendConversationReply(
  input: SendConversationReplyInput,
  deps: SendConversationReplyDeps,
): Promise<Message> {
  const conversation = deps.conversations.findById(input.conversationId);
  if (!conversation) {
    throw new Error("conversation not found");
  }

  assertCanReplyToConversation(deps.messages, conversation.id);

  const replyTarget = input.replyToMessageId
    ? deps.messages.findById(input.replyToMessageId)
    : null;

  if (input.replyToMessageId && (!replyTarget || replyTarget.conversationId !== conversation.id)) {
    throw new Error("reply target message not found in conversation");
  }

  const replyToMid = replyTarget?.igMessageId ?? null;

  const { recipientId } = await resolveMessageRecipientForSend(
    conversation,
    {
      conversations: deps.conversations,
      messages: deps.messages,
      metaConversationsReader: deps.metaConversationsReader,
      ownerIgUserId: deps.ownerIgUserId,
      ownerUsername: deps.ownerUsername,
    },
    { replyToMessage: replyTarget },
  );

  const publishResult = await deps.metaMessageSender.sendText(recipientId, input.text, {
    replyToMid,
  });

  const sentAt = new Date().toISOString();
  const igMessageId = publishResult.publishedIgMessageId ?? `local:${randomUUID()}`;

  const outbound = deps.messages.upsertOutbound({
    igMessageId,
    conversationId: conversation.id,
    text: input.text,
    igTimestamp: sentAt,
    status: "replied",
    replyToIgMessageId: replyToMid,
  });

  deps.conversations.updateLastMessageAt(conversation.id, sentAt);

  return outbound;
}
