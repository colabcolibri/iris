import type { Conversation } from "./conversation.ts";
import type { ConversationRepository } from "../../ports/conversation-repository.ts";
import type { MetaConversationsReader } from "../../ports/meta-conversations-reader.ts";
import { isConversationOwnerParticipant } from "./remote-message-utils.ts";

export type HydrateConversationParticipantDeps = {
  conversations: ConversationRepository;
  metaConversationsReader: MetaConversationsReader;
  ownerIgUserId?: string | null;
  ownerUsername?: string | null;
};

function participantNeedsHydration(conversation: Conversation): boolean {
  return (
    !conversation.participantUsername?.trim() ||
    !conversation.participantDisplayName?.trim() ||
    !conversation.participantAvatarUrl?.trim()
  );
}

export async function hydrateConversationParticipantIfNeeded(
  conversation: Conversation,
  deps: HydrateConversationParticipantDeps,
): Promise<Conversation> {
  if (!participantNeedsHydration(conversation)) {
    return conversation;
  }

  if (
    isConversationOwnerParticipant(
      {
        id: conversation.participantIgUserId,
        username: conversation.participantUsername,
        name: conversation.participantDisplayName,
        profilePicUrl: conversation.participantAvatarUrl,
      },
      deps.ownerIgUserId ?? null,
      deps.ownerUsername ?? null,
    )
  ) {
    return conversation;
  }

  const profile = await deps.metaConversationsReader.resolveParticipantProfile(
    conversation.participantIgUserId,
  );
  if (!profile) {
    return conversation;
  }

  const upserted = deps.conversations.upsert({
    igConversationId: conversation.igConversationId,
    participantIgUserId: conversation.participantIgUserId,
    participantUsername: profile.username ?? conversation.participantUsername,
    participantDisplayName: profile.name ?? conversation.participantDisplayName,
    participantAvatarUrl: profile.profilePicUrl ?? conversation.participantAvatarUrl,
    lastMessageAt: conversation.lastMessageAt,
  });

  return upserted.conversation;
}
