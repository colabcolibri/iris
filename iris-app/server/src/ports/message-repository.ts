import type { Message, MessageDirection, MessageReply, MessageStatus } from "../../domain/messages/message.ts";
import type { MessageActivityRow, MessageActivityKind } from "../../domain/messages/list-message-activity.ts";

export type PendingAgentReplyMessage = Message & {
  conversationReplyMode: string;
};

export type UpsertInboundMessageInput = {
  igMessageId: string;
  conversationId: string;
  text: string | null;
  igTimestamp: string | null;
  participantUsername?: string | null;
  attachmentUrl?: string | null;
  attachmentMediaType?: Message["attachmentMediaType"];
};

export type UpsertOutboundMessageInput = {
  igMessageId: string;
  conversationId: string;
  text: string;
  igTimestamp?: string | null;
  status?: MessageStatus;
  attachmentUrl?: string | null;
  attachmentMediaType?: Message["attachmentMediaType"];
  replyToIgMessageId?: string | null;
};

export type PurgeMessageHistoryResult = {
  messagesDeleted: number;
  conversationsDeleted: number;
};

export type MessageRepository = {
  findById(id: string): Message | null;
  findByIgMessageId(igMessageId: string): Message | null;
  listByConversationId(conversationId: string): Message[];
  upsertInbound(input: UpsertInboundMessageInput): { message: Message; created: boolean };
  upsertOutbound(input: UpsertOutboundMessageInput): Message;
  markReplied(messageId: string): Message | null;
  markSkipped(messageId: string, reason?: string | null): Message | null;
  markFailed(messageId: string, errorMessage: string): Message | null;
  markPending(messageId: string): Message | null;
  scheduleAgentReply(messageId: string, notBeforeIso: string): boolean;
  clearAgentReplySchedule(messageId: string): void;
  listPendingForAgentReply(): PendingAgentReplyMessage[];
  countPendingByConversation(conversationId: string): number;
  countUnreadByConversation(conversationId: string, readAtIso: string | null): number;
  purgeOlderThan(cutoffIso: string): PurgeMessageHistoryResult;
};

export type CreateMessageReplyInput = {
  messageId: string;
  draftText?: string | null;
  sentText?: string | null;
  status: MessageReply["status"];
  agentRunId?: string | null;
  sourceIgMessageId?: string | null;
  replyToIgMessageId?: string | null;
};

export type UpsertMessageDraftInput = {
  messageId: string;
  draftText: string;
  agentRunId?: string | null;
};

export type MessageReplyRepository = {
  findLatestDraft(messageId: string): MessageReply | null;
  findLatestSentReply(messageId: string): MessageReply | null;
  upsertDraft(input: UpsertMessageDraftInput): MessageReply;
  createReply(input: CreateMessageReplyInput): MessageReply;
  promoteDraftToSent(
    messageId: string,
    sentText: string,
    sourceIgMessageId: string | null,
  ): boolean;
  clearDraft(messageId: string): boolean;
  markSent(messageId: string, sentText: string, sourceIgMessageId: string | null): boolean;
  hasReplyRecord(messageId: string): boolean;
  listActivityRows(kind: MessageActivityKind, limit: number): MessageActivityRow[];
};
