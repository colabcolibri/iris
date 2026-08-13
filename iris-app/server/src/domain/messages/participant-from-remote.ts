import type { RemoteConversationParticipant, RemoteMessage } from "../../ports/meta-conversations-reader.ts";

export function enrichParticipantFromRemoteMessages(
  participant: RemoteConversationParticipant,
  recentMessages: RemoteMessage[],
): RemoteConversationParticipant {
  let username = participant.username;
  let name = participant.name;
  let profilePicUrl = participant.profilePicUrl;

  for (const message of recentMessages) {
    if (message.direction !== "inbound") {
      continue;
    }
    username = username ?? message.fromUsername;
    name = name ?? message.fromDisplayName;
    if (username && name) {
      break;
    }
  }

  return {
    ...participant,
    username,
    name,
    profilePicUrl,
  };
}
