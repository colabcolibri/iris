import type {
  Comment,
  CommentPostSummary,
  PostInsightsResult,
} from "./types.ts";

export const COMMENTS_CACHE_STALE_MS = 2 * 60 * 1000;
export const INSIGHTS_CACHE_STALE_MS = 15 * 60 * 1000;
export const POSTS_CACHE_STALE_MS = 60 * 1000;

export type CachedComments = {
  data: Comment[];
  fetchedAt: number;
};

export type CachedInsights = {
  data: PostInsightsResult;
  fetchedAt: number;
};

export type CachedPosts = {
  data: CommentPostSummary[];
  fetchedAt: number;
};

export function isCacheFresh(
  fetchedAt: number,
  staleMs: number,
  now = Date.now(),
): boolean {
  return now - fetchedAt < staleMs;
}

export function derivePostCountsFromComments(comments: Comment[]): {
  comments_count: number;
  pending_count: number;
} {
  const active = comments.filter((comment) => !comment.deleted_at);
  return {
    comments_count: active.length,
    pending_count: active.filter((comment) => comment.status === "pending")
      .length,
  };
}

export function postsHaveChanged(
  current: CommentPostSummary[],
  next: CommentPostSummary[],
): boolean {
  if (current.length !== next.length) {
    return true;
  }

  return next.some((post, index) => {
    const previous = current[index];
    if (!previous || previous.post_id !== post.post_id) {
      return true;
    }

    return (
      previous.comments_count !== post.comments_count ||
      previous.pending_count !== post.pending_count ||
      previous.caption !== post.caption ||
      previous.published_at !== post.published_at ||
      previous.status !== post.status ||
      previous.ig_media_status !== post.ig_media_status ||
      previous.ig_media_status_detail !== post.ig_media_status_detail ||
      previous.is_external !== post.is_external ||
      previous.preview_url !== post.preview_url ||
      previous.preview_filename !== post.preview_filename
    );
  });
}

export function patchPostSummaryCounts(
  posts: CommentPostSummary[],
  postId: string,
  counts: { comments_count: number; pending_count: number },
): CommentPostSummary[] {
  const index = posts.findIndex((post) => post.post_id === postId);
  if (index === -1) {
    return posts;
  }

  const current = posts[index]!;
  if (
    current.comments_count === counts.comments_count &&
    current.pending_count === counts.pending_count
  ) {
    return posts;
  }

  const next = [...posts];
  next[index] = {
    ...current,
    comments_count: counts.comments_count,
    pending_count: counts.pending_count,
  };
  return next;
}

export class CommentsPostCache {
  private comments = new Map<string, CachedComments>();
  private insights = new Map<string, CachedInsights>();
  private lastSyncedAt = new Map<string, number>();
  private posts: CachedPosts | null = null;

  getPosts(): CachedPosts | undefined {
    return this.posts ?? undefined;
  }

  setPosts(data: CommentPostSummary[], fetchedAt = Date.now()): void {
    this.posts = { data, fetchedAt };
  }

  invalidatePosts(): void {
    this.posts = null;
  }

  getComments(postId: string): CachedComments | undefined {
    return this.comments.get(postId);
  }

  setComments(postId: string, data: Comment[], fetchedAt = Date.now()): void {
    this.comments.set(postId, { data, fetchedAt });
  }

  getInsights(postId: string): CachedInsights | undefined {
    return this.insights.get(postId);
  }

  setInsights(
    postId: string,
    data: PostInsightsResult,
    fetchedAt = Date.now(),
  ): void {
    this.insights.set(postId, { data, fetchedAt });
  }

  getLastSyncedAt(postId: string): number | undefined {
    return this.lastSyncedAt.get(postId);
  }

  setLastSyncedAt(postId: string, syncedAt: number): void {
    this.lastSyncedAt.set(postId, syncedAt);
  }

  invalidateComments(postId: string): void {
    this.comments.delete(postId);
  }

  invalidateInsights(postId: string): void {
    this.insights.delete(postId);
  }

  pruneInactivePostIds(activePostIds: ReadonlySet<string>): void {
    for (const postId of this.comments.keys()) {
      if (!activePostIds.has(postId)) {
        this.comments.delete(postId);
      }
    }

    for (const postId of this.insights.keys()) {
      if (!activePostIds.has(postId)) {
        this.insights.delete(postId);
      }
    }

    for (const postId of this.lastSyncedAt.keys()) {
      if (!activePostIds.has(postId)) {
        this.lastSyncedAt.delete(postId);
      }
    }
  }
}
