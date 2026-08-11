export type CommentStatus = "pending" | "replied" | "skipped" | "failed";

export type Comment = {
  id: string;
  igCommentId: string;
  postId: string;
  parentIgCommentId: string | null;
  authorUsername: string | null;
  text: string | null;
  status: CommentStatus;
  errorMessage: string | null;
  createdAt: string;
  igTimestamp: string | null;
  deletedAt: string | null;
};
