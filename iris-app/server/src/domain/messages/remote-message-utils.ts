import type {
  RemoteConversationParticipant,
  RemoteMessage,
  RemoteMessageAttachment,
} from "../../ports/meta-conversations-reader.ts";

function normalizeUsername(value: string | null | undefined): string | null {
  const trimmed = value?.trim().replace(/^@+/, "").toLowerCase();
  return trimmed || null;
}

export function isConversationOwnerParticipant(
  participant: RemoteConversationParticipant,
  ownerIgUserId: string | null,
  ownerUsername?: string | null,
): boolean {
  if (ownerIgUserId && participant.id === ownerIgUserId) {
    return true;
  }

  const ownerHandle = normalizeUsername(ownerUsername);
  const participantHandle = normalizeUsername(participant.username);
  return Boolean(ownerHandle && participantHandle && ownerHandle === participantHandle);
}

export function pickConversationParticipant(
  participants: RemoteConversationParticipant[],
  ownerIgUserId: string | null,
  ownerUsername?: string | null,
): RemoteConversationParticipant | null {
  if (participants.length === 0) {
    return null;
  }

  const customer = participants.find(
    (participant) => !isConversationOwnerParticipant(participant, ownerIgUserId, ownerUsername),
  );
  return customer ?? null;
}

export function primaryMessageAttachment(
  attachments: RemoteMessageAttachment[],
): RemoteMessageAttachment | null {
  return attachments.find((item) => item.mediaType === "image") ?? attachments[0] ?? null;
}

export function remoteMessagePayload(remote: RemoteMessage) {
  const attachment = primaryMessageAttachment(remote.attachments);
  return {
    text: remote.text,
    igTimestamp: remote.createdTime,
    attachmentUrl: attachment?.url ?? null,
    attachmentMediaType: attachment?.mediaType ?? null,
  };
}
