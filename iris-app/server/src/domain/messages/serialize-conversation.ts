import type { Conversation } from "./conversation.ts";
import { isConversationAiLocked } from "./conversation-ai-lock.ts";

export function serializeConversation(conversation: Conversation) {
  return {
    id: conversation.id,
    ig_conversation_id: conversation.igConversationId,
    participant_ig_user_id: conversation.participantIgUserId,
    participant_username: conversation.participantUsername,
    participant_display_name: conversation.participantDisplayName,
    participant_avatar_url: conversation.participantAvatarUrl,
    last_message_at: conversation.lastMessageAt,
    reply_mode: conversation.replyMode,
    reply_prompt: conversation.replyPrompt,
    operator_read_at: conversation.operatorReadAt,
    ai_locked_until: conversation.aiLockedUntil,
    ai_locked_at: conversation.aiLockedAt,
    ai_locked_reason: conversation.aiLockedReason,
    ai_locked: isConversationAiLocked(conversation),
    created_at: conversation.createdAt,
    updated_at: conversation.updatedAt,
  };
}
