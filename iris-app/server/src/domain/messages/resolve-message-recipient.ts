import type { ConversationRepository } from "../../ports/conversation-repository.ts";
import type { MessageRepository } from "../../ports/message-repository.ts";
import type { MetaConversationsReader } from "../../ports/meta-conversations-reader.ts";
import { MetaMessageSendError } from "../../ports/meta-message-sender.ts";
import type { Conversation } from "./conversation.ts";
import type { Message } from "./message.ts";
import { pickConversationParticipant } from "./remote-message-utils.ts";
import { isConversationOwnerParticipant } from "./remote-message-utils.ts";
import { syncConversationMessages } from "./sync-conversation-messages.ts";

export type ResolveMessageRecipientDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  metaConversationsReader: MetaConversationsReader;
  ownerIgUserId: string | null;
  ownerUsername: string | null;
};

export type ResolveMessageRecipientOptions = {
  replyToMessage?: Pick<Message, "igMessageId" | "direction"> | null;
};

function participantIsOwner(
  participantId: string,
  participantUsername: string | null,
  ownerIgUserId: string | null,
  ownerUsername: string | null,
): boolean {
  return isConversationOwnerParticipant(
    {
      id: participantId,
      username: participantUsername,
      name: null,
      profilePicUrl: null,
    },
    ownerIgUserId,
    ownerUsername,
  );
}

function latestInboundMessage(messages: Message[]): Message | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const row = messages[index];
    if (row?.direction === "inbound") {
      return row;
    }
  }
  return null;
}

async function resolveRecipientFromMetaMessage(
  igMessageId: string,
  deps: ResolveMessageRecipientDeps,
): Promise<string | null> {
  return deps.metaConversationsReader.resolveMessagingRecipientFromIgMessage(
    igMessageId,
    deps.ownerIgUserId,
    deps.ownerUsername,
  );
}

async function resolveRecipientFromConversationSync(
  conversation: Conversation,
  deps: ResolveMessageRecipientDeps,
): Promise<string | null> {
  if (conversation.igConversationId.startsWith("ig:")) {
    return null;
  }

  await syncConversationMessages(conversation.id, {
    conversations: deps.conversations,
    messages: deps.messages,
    metaConversationsReader: deps.metaConversationsReader,
    resolveOwnerIgUserId: () => deps.ownerIgUserId,
    resolveOwnerUsername: () => deps.ownerUsername,
  });

  const updated = deps.conversations.findById(conversation.id);
  if (!updated) {
    return null;
  }

  if (
    !participantIsOwner(
      updated.participantIgUserId,
      updated.participantUsername,
      deps.ownerIgUserId,
      deps.ownerUsername,
    )
  ) {
    return updated.participantIgUserId;
  }

  return null;
}

async function resolveRecipientFromConversationParticipants(
  conversation: Conversation,
  deps: ResolveMessageRecipientDeps,
): Promise<string | null> {
  if (conversation.igConversationId.startsWith("ig:")) {
    return null;
  }

  const page = await deps.metaConversationsReader.listMessages(
    conversation.igConversationId,
    5,
  );
  const participants = page.messages
    .map((message) => ({
      id: message.fromId ?? "",
      username: message.fromUsername,
      name: message.fromDisplayName,
      profilePicUrl: null,
    }))
    .filter((participant) => Boolean(participant.id));

  const picked = pickConversationParticipant(
    participants,
    deps.ownerIgUserId,
    deps.ownerUsername,
  );
  return picked?.id ?? null;
}

function persistParticipantIfNeeded(
  conversation: Conversation,
  recipientId: string,
  deps: ResolveMessageRecipientDeps,
): Conversation {
  if (recipientId === conversation.participantIgUserId) {
    return conversation;
  }

  const { conversation: updated } = deps.conversations.upsert({
    igConversationId: conversation.igConversationId,
    participantIgUserId: recipientId,
    participantUsername: conversation.participantUsername,
    participantDisplayName: conversation.participantDisplayName,
    participantAvatarUrl: conversation.participantAvatarUrl,
    lastMessageAt: conversation.lastMessageAt,
  });
  const corrected =
    updated.participantIgUserId === recipientId
      ? updated
      : deps.conversations.updateParticipantIgUserId(conversation.id, recipientId) ?? updated;
  return corrected;
}

export async function resolveMessageRecipientForSend(
  conversation: Conversation,
  deps: ResolveMessageRecipientDeps,
  options: ResolveMessageRecipientOptions = {},
): Promise<{ recipientId: string; conversation: Conversation }> {
  const candidates: string[] = [];

  const replyMessage =
    options.replyToMessage ??
    latestInboundMessage(deps.messages.listByConversationId(conversation.id));

  if (replyMessage?.igMessageId) {
    const fromMeta = await resolveRecipientFromMetaMessage(replyMessage.igMessageId, deps);
    if (fromMeta) {
      candidates.push(fromMeta);
    }
  }

  if (
    !participantIsOwner(
      conversation.participantIgUserId,
      conversation.participantUsername,
      deps.ownerIgUserId,
      deps.ownerUsername,
    )
  ) {
    candidates.push(conversation.participantIgUserId);
  }

  const fromSync = await resolveRecipientFromConversationSync(conversation, deps);
  if (fromSync) {
    candidates.push(fromSync);
  }

  const fromParticipants = await resolveRecipientFromConversationParticipants(
    conversation,
    deps,
  );
  if (fromParticipants) {
    candidates.push(fromParticipants);
  }

  for (const candidate of candidates) {
    if (
      candidate &&
      !participantIsOwner(
        candidate,
        null,
        deps.ownerIgUserId,
        deps.ownerUsername,
      )
    ) {
      const updated = persistParticipantIfNeeded(conversation, candidate, deps);
      return { recipientId: candidate, conversation: updated };
    }
  }

  throw new MetaMessageSendError(
    "Destinatário da DM inválido: não foi possível resolver o IGSID do cliente na Meta. Peça ao cliente para enviar uma nova mensagem.",
    "invalid_recipient",
  );
}
