import type { ConversationRepository } from "../../ports/conversation-repository.ts";
import type { MessageRepository } from "../../ports/message-repository.ts";
import type { ParsedMessageEntry } from "../meta/meta-webhook.ts";

export type IngestWebhookMessageDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  pageIgUserId: string | null;
};

export type IngestWebhookMessageResult = {
  conversationId: string;
  messageId: string;
  created: boolean;
  skipped: boolean;
};

export function buildConversationIgId(participantIgUserId: string): string {
  return `ig:${participantIgUserId}`;
}

export function ingestWebhookMessage(
  entry: ParsedMessageEntry,
  deps: IngestWebhookMessageDeps,
): IngestWebhookMessageResult {
  const participantIgUserId =
    entry.direction === "inbound" ? entry.senderIgUserId : entry.recipientIgUserId;
  const participantUsername =
    entry.direction === "inbound" ? entry.senderUsername : null;
  const participantDisplayName =
    entry.direction === "inbound" ? entry.senderDisplayName : null;

  const { conversation, created: conversationCreated } = deps.conversations.upsert({
    igConversationId: buildConversationIgId(participantIgUserId),
    participantIgUserId,
    participantUsername,
    participantDisplayName,
    lastMessageAt: entry.igTimestamp,
  });

  if (entry.direction === "outbound") {
    const message = deps.messages.upsertOutbound({
      igMessageId: entry.igMessageId,
      conversationId: conversation.id,
      text: entry.text ?? "",
      igTimestamp: entry.igTimestamp,
      attachmentUrl: entry.attachmentUrl,
      attachmentMediaType: entry.attachmentMediaType ?? undefined,
      status: "replied",
    });

    return {
      conversationId: conversation.id,
      messageId: message.id,
      created: conversationCreated,
      skipped: true,
    };
  }

  const result = deps.messages.upsertInbound({
    igMessageId: entry.igMessageId,
    conversationId: conversation.id,
    text: entry.text,
    igTimestamp: entry.igTimestamp,
    participantUsername,
    attachmentUrl: entry.attachmentUrl,
    attachmentMediaType: entry.attachmentMediaType ?? undefined,
  });

  if (participantUsername || participantDisplayName) {
    deps.conversations.upsert({
      igConversationId: conversation.igConversationId,
      participantIgUserId: conversation.participantIgUserId,
      participantUsername: participantUsername ?? conversation.participantUsername,
      participantDisplayName:
        participantDisplayName ?? conversation.participantDisplayName,
      participantAvatarUrl: conversation.participantAvatarUrl,
      lastMessageAt: entry.igTimestamp ?? conversation.lastMessageAt,
    });
  } else if (entry.igTimestamp) {
    deps.conversations.updateLastMessageAt(conversation.id, entry.igTimestamp);
  }

  return {
    conversationId: conversation.id,
    messageId: result.message.id,
    created: result.created,
    skipped: false,
  };
}
