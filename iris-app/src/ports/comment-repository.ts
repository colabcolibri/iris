import type { Comment, CommentStatus } from "../domain/comment.ts";

export type UpsertCommentInput = {
  igCommentId: string;
  postId: string;
  parentIgCommentId?: string | null;
  authorUsername?: string | null;
  text?: string | null;
};

export type SentCommentReply = {
  commentId: string;
  sentText: string;
};

export type PendingAgentReplyComment = Comment & {
  postCaption: string | null;
  replyMode: string;
};

export type CreateReplyInput = {
  commentId: string;
  status: "sent" | "failed" | "draft";
  sentText?: string | null;
  draftText?: string | null;
  agentRunId?: string | null;
};

export type CommentReplyRecord = {
  id: string;
  commentId: string;
  sentText: string | null;
  draftText: string | null;
  status: string;
};

export type CommentRepository = {
  upsertFromWebhook(input: UpsertCommentInput): { comment: Comment; created: boolean };
  findByIgCommentId(igCommentId: string): Comment | null;
  listByPostId(postId: string): Comment[];
  countByPostId(postId: string): { total: number; pending: number };
  listSentRepliesByPostId(postId: string): SentCommentReply[];
  listPendingForAgentReply(): PendingAgentReplyComment[];
  hasReplyRecord(commentId: string): boolean;
  promoteDraftToSent(commentId: string, sentText: string): boolean;
  findLatestDraft(commentId: string): CommentReplyRecord | null;
  findById(id: string): Comment | null;
  markReplied(id: string): Comment | null;
  markFailed(id: string, errorMessage: string): Comment | null;
  createReply(input: CreateReplyInput): CommentReplyRecord;
};
