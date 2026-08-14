import type { Comment, CommentStatus } from "../domain/comments/comment.ts";
import type {
  CommentActivityKind,
  CommentActivityRow,
} from "../domain/comments/list-comment-activity.ts";

export type UpsertCommentInput = {
  igCommentId: string;
  postId: string;
  parentIgCommentId?: string | null;
  authorUsername?: string | null;
  text?: string | null;
  igTimestamp?: string | null;
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
  sourceIgCommentId?: string | null;
  replyToIgCommentId?: string | null;
};

export type LinkInstagramReplyInput = {
  userCommentId: string;
  brandIgCommentId: string;
  sentText: string | null;
};

export type CommentReplyRecord = {
  id: string;
  commentId: string;
  sentText: string | null;
  draftText: string | null;
  status: string;
  sourceIgCommentId: string | null;
  replyToIgCommentId: string | null;
};

export type CommentRepository = {
  upsertFromWebhook(input: UpsertCommentInput): { comment: Comment; created: boolean };
  findByIgCommentId(igCommentId: string): Comment | null;
  listByPostId(postId: string): Comment[];
  countByPostId(postId: string): { total: number; pending: number };
  listSentRepliesByPostId(postId: string): SentCommentReply[];
  listPendingForAgentReply(): PendingAgentReplyComment[];
  listScheduledForAgentReply(): PendingAgentReplyComment[];
  hasReplyRecord(commentId: string): boolean;
  promoteDraftToSent(
    commentId: string,
    sentText: string,
    meta?: { replyToIgCommentId?: string | null; sourceIgCommentId?: string | null },
  ): boolean;
  findLatestDraft(commentId: string): CommentReplyRecord | null;
  findLatestSentReply(commentId: string): CommentReplyRecord | null;
  clearDraft(commentId: string): boolean;
  updateDraft(commentId: string, draftText: string): boolean;
  upsertDraft(
    commentId: string,
    draftText: string,
    options?: { agentRunId?: string | null },
  ): CommentReplyRecord;
  markDeletedFromInstagram(commentId: string): boolean;
  restoreFromInstagram(commentId: string): boolean;
  findById(id: string): Comment | null;
  markReplied(id: string): Comment | null;
  markPending(id: string): Comment | null;
  markSkipped(id: string, errorMessage?: string | null): Comment | null;
  markFailed(id: string, errorMessage: string): Comment | null;
  scheduleAgentReply(commentId: string, notBeforeIso: string): boolean;
  clearAgentReplySchedule(commentId: string): void;
  createReply(input: CreateReplyInput): CommentReplyRecord;
  linkInstagramReply(input: LinkInstagramReplyInput): boolean;
  listActivityRows(
    kind: CommentActivityKind,
    limit: number,
    brandUsername: string | null,
  ): CommentActivityRow[];
};
