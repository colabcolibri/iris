export type MetaCommentReplier = {
  reply(
    igCommentId: string,
    message: string,
  ): Promise<{ publishedIgCommentId?: string | null }>;
};
