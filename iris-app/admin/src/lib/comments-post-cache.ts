import type { Comment, PostInsightsResult } from "@/lib/types";

export const COMMENTS_CACHE_STALE_MS = 2 * 60 * 1000;
export const INSIGHTS_CACHE_STALE_MS = 15 * 60 * 1000;

export type CachedComments = {
  data: Comment[];
  fetchedAt: number;
};

export type CachedInsights = {
  data: PostInsightsResult;
  fetchedAt: number;
};

export function isCacheFresh(fetchedAt: number, staleMs: number, now = Date.now()): boolean {
  return now - fetchedAt < staleMs;
}

export class CommentsPostCache {
  private comments = new Map<string, CachedComments>();
  private insights = new Map<string, CachedInsights>();
  private lastSyncedAt = new Map<string, number>();

  getComments(postId: string): CachedComments | undefined {
    return this.comments.get(postId);
  }

  setComments(postId: string, data: Comment[], fetchedAt = Date.now()): void {
    this.comments.set(postId, { data, fetchedAt });
  }

  getInsights(postId: string): CachedInsights | undefined {
    return this.insights.get(postId);
  }

  setInsights(postId: string, data: PostInsightsResult, fetchedAt = Date.now()): void {
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
