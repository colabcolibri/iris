import type { ConversationRepository } from "../../ports/conversation-repository.ts";
import type { MessageRepository } from "../../ports/message-repository.ts";
import type { RemoteMessage } from "../../ports/meta-conversations-reader.ts";
import { isWithinMessageImportWindow } from "./message-sync-window.ts";
import { remoteMessagePayload } from "./remote-message-utils.ts";
import { reconcileConversationPendingStatuses } from "./reconcile-conversation-pending-statuses.ts";

export type ApplyRemoteMessagesDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
};

export type ApplyRemoteMessagesResult = {
  imported: number;
  updated: number;
};

export function applyRemoteMessages(
  conversationId: string,
  remoteMessages: RemoteMessage[],
  deps: ApplyRemoteMessagesDeps,
): ApplyRemoteMessagesResult {
  const conversation = deps.conversations.findById(conversationId);
  if (!conversation) {
    throw new Error("conversation not found");
  }

  let imported = 0;
  let updated = 0;
  let lastTimestamp: string | null = conversation.lastMessageAt;
  let latestParticipantUsername: string | null = conversation.participantUsername;
  let latestParticipantDisplayName: string | null = conversation.participantDisplayName;

  for (const remote of remoteMessages) {
    if (!isWithinMessageImportWindow(remote.createdTime)) {
      continue;
    }

    const payload = remoteMessagePayload(remote);

    if (remote.direction === "inbound") {
      if (remote.fromUsername) {
        latestParticipantUsername = remote.fromUsername;
      }
      if (remote.fromDisplayName) {
        latestParticipantDisplayName = remote.fromDisplayName;
      }

      const result = deps.messages.upsertInbound({
        igMessageId: remote.id,
        conversationId: conversation.id,
        ...payload,
        participantUsername: remote.fromUsername,
      });
      if (result.created) {
        imported += 1;
      } else {
        updated += 1;
      }
    } else {
      const existing = deps.messages.findByIgMessageId(remote.id);
      if (!existing) {
        deps.messages.upsertOutbound({
          igMessageId: remote.id,
          conversationId: conversation.id,
          text: remote.text ?? "",
          ...payload,
          status: "replied",
        });
        imported += 1;
      } else {
        deps.messages.upsertOutbound({
          igMessageId: remote.id,
          conversationId: conversation.id,
          text: remote.text ?? existing.text ?? "",
          ...payload,
          status: existing.status,
        });
        updated += 1;
      }
    }

    if (remote.createdTime) {
      lastTimestamp = remote.createdTime;
    }
  }

  if (latestParticipantUsername || latestParticipantDisplayName) {
    deps.conversations.upsert({
      igConversationId: conversation.igConversationId,
      participantIgUserId: conversation.participantIgUserId,
      participantUsername: latestParticipantUsername ?? conversation.participantUsername,
      participantDisplayName:
        latestParticipantDisplayName ?? conversation.participantDisplayName,
      participantAvatarUrl: conversation.participantAvatarUrl,
      lastMessageAt: lastTimestamp ?? conversation.lastMessageAt,
    });
  } else if (lastTimestamp) {
    deps.conversations.updateLastMessageAt(conversation.id, lastTimestamp);
  }

  reconcileConversationPendingStatuses(conversation.id, deps.messages);

  return { imported, updated };
}
