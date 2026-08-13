import type { Conversation } from "./conversation.ts";
import type { Message } from "./message.ts";

export function latestConversationActivityIso(
  messages: Array<Pick<Message, "igTimestamp" | "createdAt">>,
): string | null {
  let latest: string | null = null;
  for (const message of messages) {
    const candidate = message.igTimestamp ?? message.createdAt;
    if (!candidate) {
      continue;
    }
    if (!latest || Date.parse(candidate) > Date.parse(latest)) {
      latest = candidate;
    }
  }
  return latest;
}

export function markConversationReadUpTo(
  conversation: Conversation,
  messages: Array<Pick<Message, "igTimestamp" | "createdAt">>,
): string | null {
  return latestConversationActivityIso(messages) ?? conversation.lastMessageAt;
}
