export type MessageDirection = "inbound" | "outbound";

export type MessageStatus = "pending" | "replied" | "skipped" | "failed";

export type MessageAttachmentMediaType = "image" | "video" | "file";

export type Message = {
  id: string;
  igMessageId: string;
  conversationId: string;
  direction: MessageDirection;
  text: string | null;
  attachmentUrl: string | null;
  attachmentMediaType: MessageAttachmentMediaType | null;
  igTimestamp: string | null;
  status: MessageStatus;
  errorMessage: string | null;
  agentReplyNotBefore: string | null;
  createdAt: string;
};

export type MessageReplyStatus = "draft" | "sent" | "failed";

export type MessageReply = {
  id: string;
  messageId: string;
  draftText: string | null;
  sentText: string | null;
  status: MessageReplyStatus;
  agentRunId: string | null;
  sourceIgMessageId: string | null;
  createdAt: string;
};
