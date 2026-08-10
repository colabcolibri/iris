export type CommentPostSummary = {
  postId: string;
  caption: string | null;
  publishedAt: string | null;
  igMediaId: string;
  commentsCount: number;
  pendingCount: number;
};

export type ListCommentPostsDeps = {
  listPublishedPosts: () => Array<{
    id: string;
    caption: string | null;
    publishedAt: string | null;
    igMediaId: string | null;
  }>;
  countCommentsByPostId: (postId: string) => { total: number; pending: number };
};

export function listCommentPosts(deps: ListCommentPostsDeps): CommentPostSummary[] {
  return deps
    .listPublishedPosts()
    .filter((post): post is typeof post & { igMediaId: string } => Boolean(post.igMediaId))
    .map((post) => {
      const counts = deps.countCommentsByPostId(post.id);
      return {
        postId: post.id,
        caption: post.caption,
        publishedAt: post.publishedAt,
        igMediaId: post.igMediaId,
        commentsCount: counts.total,
        pendingCount: counts.pending,
      };
    })
    .sort((left, right) => {
      const leftTime = Date.parse(left.publishedAt ?? "");
      const rightTime = Date.parse(right.publishedAt ?? "");
      return rightTime - leftTime;
    });
}
