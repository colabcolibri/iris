import type { ConversationRepository } from "../../ports/conversation-repository.ts";
import type { MessageRepository } from "../../ports/message-repository.ts";
import type { MetaConversationsReader } from "../../ports/meta-conversations-reader.ts";
import { applyRemoteMessages } from "./apply-remote-messages.ts";
import { enrichParticipantFromRemoteMessages } from "./participant-from-remote.ts";
import { pickConversationParticipant } from "./remote-message-utils.ts";
import { isWithinMessageImportWindow } from "./message-sync-window.ts";

export const MESSAGE_SYNC_PAGE_SIZE = 25;
export const MESSAGE_SYNC_CONVERSATION_MAX_PAGES = 3;

export type SyncConversationMessagesDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  metaConversationsReader: MetaConversationsReader;
  resolveOwnerIgUserId?: () => string | null;
  resolveOwnerUsername?: () => string | null;
};

export type SyncConversationMessagesOptions = {
  maxPages?: number;
};

export type SyncConversationMessagesResult = {
  conversationId: string;
  imported: number;
  updated: number;
};

export async function syncConversationMessages(
  localConversationId: string,
  deps: SyncConversationMessagesDeps,
  options: SyncConversationMessagesOptions = {},
): Promise<SyncConversationMessagesResult> {
  const conversation = deps.conversations.findById(localConversationId);
  if (!conversation) {
    throw new Error("conversation not found");
  }

  const maxPages = options.maxPages ?? MESSAGE_SYNC_CONVERSATION_MAX_PAGES;
  const collected = [];
  let after: string | undefined;
  let pagesFetched = 0;
  let reachedHistoryCutoff = false;

  do {
    const page = await deps.metaConversationsReader.listMessages(
      conversation.igConversationId,
      MESSAGE_SYNC_PAGE_SIZE,
      after,
    );
    pagesFetched += 1;

    for (const remote of page.messages) {
      if (!isWithinMessageImportWindow(remote.createdTime)) {
        reachedHistoryCutoff = true;
        continue;
      }
      collected.push(remote);
    }

    if (reachedHistoryCutoff || pagesFetched >= maxPages) {
      break;
    }

    after = page.after ?? undefined;
  } while (after);

  const result = applyRemoteMessages(conversation.id, collected, deps);
  return { conversationId: conversation.id, ...result };
}

/** Import em lote: 1 chamada à Graph API (conversas + preview de mensagens). */
export async function syncConversationsFromMeta(
  limit: number,
  deps: SyncConversationMessagesDeps,
): Promise<{ synced: number }> {
  const ownerIgUserId = deps.resolveOwnerIgUserId?.() ?? null;
  const ownerUsername = deps.resolveOwnerUsername?.() ?? null;
  const remote = await deps.metaConversationsReader.listConversations(limit, {
    includeRecentMessages: true,
  });
  let synced = 0;

  for (const row of remote) {
    if (!isWithinMessageImportWindow(row.updatedTime)) {
      continue;
    }

    const picked = pickConversationParticipant(
      row.participants,
      ownerIgUserId,
      ownerUsername,
    );
    if (!picked) {
      continue;
    }

    const participant = enrichParticipantFromRemoteMessages(
      picked,
      row.recentMessages ?? [],
    );

    const existing =
      deps.conversations.findByParticipantIgUserId(participant.id) ??
      deps.conversations.findByIgConversationId(row.id);

    const upserted = deps.conversations.upsert({
      igConversationId: row.id,
      participantIgUserId: participant.id,
      participantUsername: participant.username,
      participantDisplayName: participant.name,
      participantAvatarUrl: participant.profilePicUrl,
      lastMessageAt: row.updatedTime,
    });

    const conversationId = existing?.id ?? upserted.conversation.id;
    applyRemoteMessages(conversationId, row.recentMessages ?? [], deps);
    synced += 1;
  }

  return { synced };
}
