import type { AppContext } from "../../api/app-context.ts";
import { ValidationError } from "../../api/json.ts";
import {
  getMetaReadiness,
  MetaNotConnectedError,
} from "../meta/meta-readiness.ts";
import {
  likesFromInsightMetrics,
  persistPostEngagement,
} from "../posts/persist-post-engagement.ts";

export type RefreshMediaInsightsPageInput = {
  limit?: number;
  after?: string | null;
  since?: string | null;
  until?: string | null;
  force?: boolean;
};

export type RefreshMediaInsightsPageResult = {
  items_scanned: number;
  refreshed: string[];
  unmatched_ig_media_ids: string[];
  next_cursor: string | null;
  meta_call_count: number;
};

export async function refreshMediaInsightsPage(
  ctx: AppContext,
  input: RefreshMediaInsightsPageInput = {},
): Promise<RefreshMediaInsightsPageResult> {
  const readiness = getMetaReadiness(ctx);
  if (!readiness.ready) {
    throw new MetaNotConnectedError(readiness);
  }

  const page = await ctx.metaInsightsReader.listMediaPageWithInsights({
    limit: input.limit,
    after: input.after,
    sinceIso: input.since,
    untilIso: input.until,
  });

  const refreshed: string[] = [];
  const unmatched: string[] = [];
  const fetchedAt = new Date().toISOString();

  for (const item of page.items) {
    const post = ctx.posts.findCommentableByIgMediaId(item.igMediaId);
    if (!post) {
      unmatched.push(item.igMediaId);
      continue;
    }

    const likes =
      likesFromInsightMetrics(item.insights) ?? item.likeCount ?? null;

    ctx.postInsightsStore.insert({
      postId: post.id,
      igMediaId: item.igMediaId,
      metrics: item.insights,
      media: null,
      fetchedAt,
    });

    persistPostEngagement(ctx.posts, post.id, {
      likeCount: likes,
      reportedCommentsCount: item.commentsCount,
    });

    refreshed.push(post.id);
  }

  return {
    items_scanned: page.items.length,
    refreshed,
    unmatched_ig_media_ids: unmatched,
    next_cursor: page.nextCursor,
    meta_call_count: 1,
  };
}
