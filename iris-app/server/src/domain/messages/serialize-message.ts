import type { Message } from "./message.ts";

export function serializeMessage(message: Message) {
  return {
    id: message.id,
    ig_message_id: message.igMessageId,
    conversation_id: message.conversationId,
    direction: message.direction,
    text: message.text,
    attachment_url: message.attachmentUrl,
    attachment_media_type: message.attachmentMediaType,
    ig_timestamp: message.igTimestamp,
    status: message.status,
    error_message: message.errorMessage,
    agent_reply_not_before: message.agentReplyNotBefore,
    reply_to_ig_message_id: message.replyToIgMessageId,
    created_at: message.createdAt,
  };
}
