import type { ConversationRepository } from "../../ports/conversation-repository.ts";
import type { MessageRepository } from "../../ports/message-repository.ts";
import type { MetaConversationsReader } from "../../ports/meta-conversations-reader.ts";
import { MetaMessageSendError } from "../../ports/meta-message-sender.ts";
import type { Conversation } from "./conversation.ts";
import { isConversationOwnerParticipant } from "./remote-message-utils.ts";
import { syncConversationMessages } from "./sync-conversation-messages.ts";

export type ResolveMessageRecipientDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  metaConversationsReader: MetaConversationsReader;
  ownerIgUserId: string | null;
  ownerUsername: string | null;
};

function participantIsOwner(
  conversation: Conversation,
  ownerIgUserId: string | null,
  ownerUsername: string | null,
): boolean {
  return isConversationOwnerParticipant(
    {
      id: conversation.participantIgUserId,
      username: conversation.participantUsername,
      name: conversation.participantDisplayName,
      profilePicUrl: conversation.participantAvatarUrl,
    },
    ownerIgUserId,
    ownerUsername,
  );
}

export async function resolveMessageRecipientForSend(
  conversation: Conversation,
  deps: ResolveMessageRecipientDeps,
): Promise<{ recipientId: string; conversation: Conversation }> {
  if (!participantIsOwner(conversation, deps.ownerIgUserId, deps.ownerUsername)) {
    return { recipientId: conversation.participantIgUserId, conversation };
  }

  if (!conversation.igConversationId.startsWith("ig:")) {
    await syncConversationMessages(conversation.id, {
      conversations: deps.conversations,
      messages: deps.messages,
      metaConversationsReader: deps.metaConversationsReader,
      resolveOwnerIgUserId: () => deps.ownerIgUserId,
      resolveOwnerUsername: () => deps.ownerUsername,
    });
    const updated = deps.conversations.findById(conversation.id);
    if (updated && !participantIsOwner(updated, deps.ownerIgUserId, deps.ownerUsername)) {
      return { recipientId: updated.participantIgUserId, conversation: updated };
    }
  }

  throw new MetaMessageSendError(
    "Destinatário da DM inválido: a conversa está associada à conta conectada em vez do cliente. Peça ao cliente para enviar uma nova mensagem ou sincronize as conversas.",
    "invalid_recipient",
  );
}
