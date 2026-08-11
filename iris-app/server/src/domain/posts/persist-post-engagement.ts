import type { MediaInsightMetric } from "../../ports/meta-insights-reader.ts";
import type { PostRepository } from "../../ports/post-repository.ts";

export function likesFromInsightMetrics(
  metrics: MediaInsightMetric[] | undefined,
): number | null {
  const metric = metrics?.find((item) => item.name === "likes");
  const value = metric?.values[0]?.value;
  return typeof value === "number" ? value : null;
}

/** Persiste curtidas / comments_count Meta no post (inbox). */
export function persistPostEngagement(
  posts: PostRepository,
  postId: string,
  engagement: {
    likeCount?: number | null;
    reportedCommentsCount?: number | null;
  },
): void {
  const patch: {
    likeCount?: number | null;
    reportedCommentsCount?: number | null;
  } = {};

  if (engagement.likeCount !== undefined) {
    patch.likeCount = engagement.likeCount;
  }
  if (engagement.reportedCommentsCount !== undefined) {
    patch.reportedCommentsCount = engagement.reportedCommentsCount;
  }
  if (Object.keys(patch).length === 0) {
    return;
  }
  posts.update(postId, patch);
}
