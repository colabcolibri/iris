import type { AppContext } from "../../api/app-context.ts";
import { ValidationError } from "../../api/json.ts";
import {
  resolvePostMedia,
} from "../post-media/resolve-post-media.ts";
import { serializePostMedia } from "../post-media/serialize-post-media.ts";
import {
  type PostInsightsResponse,
  serializePostInsightsSnapshot,
} from "./post-insights-response.ts";

export const INSIGHTS_CACHE_STALE_MS = 60 * 60 * 1000;

export type FetchPostInsightsOptions = {
  force?: boolean;
};

export async function fetchPostInsights(
  ctx: AppContext,
  postId: string,
  options: FetchPostInsightsOptions = {},
): Promise<PostInsightsResponse> {
  const post = ctx.posts.findById(postId);
  if (!post) {
    throw new ValidationError("post not found");
  }

  if (!post.igMediaId) {
    throw new ValidationError("post has no ig_media_id");
  }

  if (!options.force) {
    const cached = ctx.postInsightsStore.findLatestByPostId(postId);
    if (cached && Date.now() - Date.parse(cached.fetchedAt) < INSIGHTS_CACHE_STALE_MS) {
      return serializePostInsightsSnapshot(cached, { fromCache: true });
    }
  }

  let insightsMessage: string | null = null;
  let metrics: Awaited<ReturnType<typeof ctx.metaInsightsReader.getMediaInsights>> = [];

  try {
    metrics = await ctx.metaInsightsReader.getMediaInsights(post.igMediaId);
  } catch (error) {
    insightsMessage =
      error instanceof Error ? error.message : "Falha ao consultar insights.";
  }

  const resolvedMedia = await resolvePostMedia(postId, {
    posts: ctx.posts,
    assets: ctx.assets,
    metaCommentReader: ctx.metaCommentReader,
    publicBaseUrl: ctx.publicBaseUrl,
    publishUrlSecret: ctx.publishUrlSecret,
  });
  const media = serializePostMedia(resolvedMedia);
  const fetchedAt = new Date().toISOString();

  const snapshot = ctx.postInsightsStore.insert({
    postId,
    igMediaId: post.igMediaId,
    metrics,
    media,
    fetchedAt,
  });

  return serializePostInsightsSnapshot(snapshot, {
    fromCache: false,
    ok: insightsMessage === null,
    code: insightsMessage ? "insights_failed" : undefined,
    message: insightsMessage,
  });
}
