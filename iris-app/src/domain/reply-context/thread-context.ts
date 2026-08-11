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

export function sortThreadEntriesChronologically(
  entries: CommentThreadEntry[],
): CommentThreadEntry[] {
  return [...entries].sort((left, right) => {
    const leftMs = Date.parse(left.at);
    const rightMs = Date.parse(right.at);
    const leftTime = Number.isNaN(leftMs) ? 0 : leftMs;
    const rightTime = Number.isNaN(rightMs) ? 0 : rightMs;

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    if (left.isBrandReply !== right.isBrandReply) {
      return left.isBrandReply ? 1 : -1;
    }

    return 0;
  });
}
