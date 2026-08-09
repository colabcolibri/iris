export type CommentStatus = "pending" | "replied" | "skipped" | "failed";

export type Comment = {
  id: string;
  igCommentId: string;
  postId: string;
  authorUsername: string | null;
  text: string | null;
  status: CommentStatus;
  errorMessage: string | null;
  createdAt: string;
};
