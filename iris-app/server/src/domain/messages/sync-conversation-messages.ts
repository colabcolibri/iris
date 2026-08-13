import type { ConversationRepository } from "../../ports/conversation-repository.ts";
import type { MessageRepository } from "../../ports/message-repository.ts";
import type { MetaConversationsReader } from "../../ports/meta-conversations-reader.ts";

export type SyncConversationMessagesDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  metaConversationsReader: MetaConversationsReader;
};

export type SyncConversationMessagesResult = {
  conversationId: string;
  imported: number;
  updated: number;
};

export async function syncConversationMessages(
  localConversationId: string,
  deps: SyncConversationMessagesDeps,
): Promise<SyncConversationMessagesResult> {
  const conversation = deps.conversations.findById(localConversationId);
  if (!conversation) {
    throw new Error("conversation not found");
  }

  let imported = 0;
  let updated = 0;
  let after: string | undefined;
  let lastTimestamp: string | null = conversation.lastMessageAt;

  do {
    const page = await deps.metaConversationsReader.listMessages(
      conversation.igConversationId,
      50,
      after,
    );

    for (const remote of page.messages) {
      if (remote.direction === "inbound") {
        const result = deps.messages.upsertInbound({
          igMessageId: remote.id,
          conversationId: conversation.id,
          text: remote.text,
          igTimestamp: remote.createdTime,
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
            igTimestamp: remote.createdTime,
            status: "replied",
          });
          imported += 1;
        }
      }

      if (remote.createdTime) {
        lastTimestamp = remote.createdTime;
      }
    }

    after = page.after ?? undefined;
  } while (after);

  if (lastTimestamp) {
    deps.conversations.updateLastMessageAt(conversation.id, lastTimestamp);
  }

  return { conversationId: conversation.id, imported, updated };
}

export async function syncConversationsFromMeta(
  limit: number,
  deps: SyncConversationMessagesDeps,
): Promise<{ synced: number }> {
  const remote = await deps.metaConversationsReader.listConversations(limit);
  let synced = 0;

  for (const row of remote) {
    const existing = deps.conversations.findByIgConversationId(row.id);
    if (existing) {
      if (row.updatedTime) {
        deps.conversations.updateLastMessageAt(existing.id, row.updatedTime);
      }
      await syncConversationMessages(existing.id, deps);
      synced += 1;
      continue;
    }

    const created = deps.conversations.upsert({
      igConversationId: row.id,
      participantIgUserId: `unknown:${row.id}`,
      lastMessageAt: row.updatedTime,
    });
    await syncConversationMessages(created.conversation.id, deps);
    synced += 1;
  }

  return { synced };
}
