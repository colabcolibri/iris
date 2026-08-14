import type { Conversation, ConversationReplyMode } from "../../domain/messages/conversation.ts";

export type UpsertConversationInput = {
  igConversationId: string;
  participantIgUserId: string;
  participantUsername?: string | null;
  participantDisplayName?: string | null;
  participantAvatarUrl?: string | null;
  lastMessageAt?: string | null;
};

export type ConversationRepository = {
  findById(id: string): Conversation | null;
  findByIgConversationId(igConversationId: string): Conversation | null;
  findByParticipantIgUserId(participantIgUserId: string): Conversation | null;
  upsert(input: UpsertConversationInput): { conversation: Conversation; created: boolean };
  updateParticipantIgUserId(
    conversationId: string,
    participantIgUserId: string,
  ): Conversation | null;
  updateLastMessageAt(conversationId: string, iso: string): void;
  updateReplyMode(conversationId: string, replyMode: ConversationReplyMode): Conversation | null;
  updateReplyPrompt(conversationId: string, replyPrompt: string | null): Conversation | null;
  updateOperatorReadAt(conversationId: string, iso: string): Conversation | null;
  listRecent(limit: number): Conversation[];
};
