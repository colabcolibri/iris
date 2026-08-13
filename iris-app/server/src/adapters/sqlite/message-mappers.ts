import type { Conversation, ConversationReplyMode } from "../../domain/messages/conversation.ts";
import type { Message, MessageReply } from "../../domain/messages/message.ts";
import type { Product } from "../../domain/products/product.ts";

type ConversationRow = {
  id: string;
  ig_conversation_id: string;
  participant_ig_user_id: string;
  participant_username: string | null;
  last_message_at: string | null;
  reply_mode: string;
  reply_prompt: string | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  ig_message_id: string;
  conversation_id: string;
  direction: string;
  text: string | null;
  ig_timestamp: string | null;
  status: string;
  error_message: string | null;
  agent_reply_not_before: string | null;
  created_at: string;
};

type MessageReplyRow = {
  id: string;
  message_id: string;
  draft_text: string | null;
  sent_text: string | null;
  status: string;
  agent_run_id: string | null;
  source_ig_message_id: string | null;
  created_at: string;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  long_description: string;
  active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function parseReplyMode(value: string): ConversationReplyMode {
  if (value === "off" || value === "auto" || value === "draft") {
    return value;
  }
  return "inherit";
}

export function mapConversationRow(row: ConversationRow): Conversation {
  return {
    id: row.id,
    igConversationId: row.ig_conversation_id,
    participantIgUserId: row.participant_ig_user_id,
    participantUsername: row.participant_username,
    lastMessageAt: row.last_message_at,
    replyMode: parseReplyMode(row.reply_mode),
    replyPrompt: row.reply_prompt,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMessageRow(row: MessageRow): Message {
  return {
    id: row.id,
    igMessageId: row.ig_message_id,
    conversationId: row.conversation_id,
    direction: row.direction as Message["direction"],
    text: row.text,
    igTimestamp: row.ig_timestamp,
    status: row.status as Message["status"],
    errorMessage: row.error_message,
    agentReplyNotBefore: row.agent_reply_not_before,
    createdAt: row.created_at,
  };
}

export function mapMessageReplyRow(row: MessageReplyRow): MessageReply {
  return {
    id: row.id,
    messageId: row.message_id,
    draftText: row.draft_text,
    sentText: row.sent_text,
    status: row.status as MessageReply["status"],
    agentRunId: row.agent_run_id,
    sourceIgMessageId: row.source_ig_message_id,
    createdAt: row.created_at,
  };
}

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    active: row.active === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type { ConversationRow, MessageRow, MessageReplyRow, ProductRow };
