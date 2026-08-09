export type CommentThreadEntry = {
  author: string | null;
  text: string | null;
  isBrandReply: boolean;
  at: string;
  igCommentId?: string | null;
};

export type CommentThreadContext = {
  entries: CommentThreadEntry[];
};
