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

export type CommentReplyRecord = {
  id: string;
  commentId: string;
  sentText: string | null;
  status: string;
};

export type PendingAutoReplyComment = Comment & {
  postCaption: string | null;
};

export type CommentRepository = {
  upsertFromWebhook(input: UpsertCommentInput): { comment: Comment; created: boolean };
  findByIgCommentId(igCommentId: string): Comment | null;
  listByPostId(postId: string): Comment[];
  listSentRepliesByPostId(postId: string): SentCommentReply[];
  listPendingForAutoReply(): PendingAutoReplyComment[];
  findById(id: string): Comment | null;
  markReplied(id: string): Comment | null;
  markFailed(id: string, errorMessage: string): Comment | null;
  createReply(
    commentId: string,
    sentText: string,
    status: CommentStatus | "sent" | "failed",
    agentRunId?: string | null,
  ): CommentReplyRecord;
};
