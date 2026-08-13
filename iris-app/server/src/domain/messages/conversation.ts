export type ConversationReplyMode = "inherit" | "off" | "auto" | "draft";

export type Conversation = {
  id: string;
  igConversationId: string;
  participantIgUserId: string;
  participantUsername: string | null;
  participantDisplayName: string | null;
  participantAvatarUrl: string | null;
  lastMessageAt: string | null;
  replyMode: ConversationReplyMode;
  replyPrompt: string | null;
  operatorReadAt: string | null;
  createdAt: string;
  updatedAt: string;
};
