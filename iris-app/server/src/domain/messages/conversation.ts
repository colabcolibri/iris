export type ConversationReplyMode = "inherit" | "off" | "auto" | "draft";

export type Conversation = {
  id: string;
  igConversationId: string;
  participantIgUserId: string;
  participantUsername: string | null;
  lastMessageAt: string | null;
  replyMode: ConversationReplyMode;
  replyPrompt: string | null;
  createdAt: string;
  updatedAt: string;
};
