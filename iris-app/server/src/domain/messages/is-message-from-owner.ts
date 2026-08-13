import type { RemoteConversationParticipant } from "../../ports/meta-conversations-reader.ts";
import { isConversationOwnerParticipant } from "./remote-message-utils.ts";

export type MessageOwnerContext = {
  igUserId: string | null;
  igUsername: string | null;
};

export function isMessageFromOwner(
  senderId: string,
  senderUsername: string | null,
  owner: MessageOwnerContext,
  extraOwnerIds: Iterable<string> = [],
): boolean {
  const participant: RemoteConversationParticipant = {
    id: senderId,
    username: senderUsername,
    name: null,
    profilePicUrl: null,
  };

  if (isConversationOwnerParticipant(participant, owner.igUserId, owner.igUsername)) {
    return true;
  }

  for (const id of extraOwnerIds) {
    if (id && senderId === id) {
      return true;
    }
  }

  return false;
}
