import type { Conversation } from "./conversation.ts";

export function serializeConversation(conversation: Conversation) {
  return {
    id: conversation.id,
    ig_conversation_id: conversation.igConversationId,
    participant_ig_user_id: conversation.participantIgUserId,
    participant_username: conversation.participantUsername,
    last_message_at: conversation.lastMessageAt,
    reply_mode: conversation.replyMode,
    reply_prompt: conversation.replyPrompt,
    created_at: conversation.createdAt,
    updated_at: conversation.updatedAt,
  };
}
