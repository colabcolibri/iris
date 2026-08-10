export type CommentThreadEntry = {
  author: string | null;
  text: string | null;
  isBrandReply: boolean;
  at: string;
  igCommentId?: string | null;
  depth: number;
};

export type CommentThreadContext = {
  entries: CommentThreadEntry[];
};
