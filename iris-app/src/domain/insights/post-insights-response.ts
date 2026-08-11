import type { MediaInsightMetric } from "../../ports/meta-insights-reader.ts";
import type { PostInsightsSnapshot } from "../../ports/post-insights-store.ts";
import type { SerializedPostMedia } from "../post-media/serialize-post-media.ts";

export type PostInsightsResponse = {
  ok: boolean;
  code?: string;
  message?: string;
  post_id: string;
  ig_media_id: string | null;
  fetched_at: string;
  from_cache: boolean;
  insights: MediaInsightMetric[];
  media: SerializedPostMedia | null;
};

export function serializePostInsightsSnapshot(
  snapshot: PostInsightsSnapshot,
  options: {
    fromCache: boolean;
    ok?: boolean;
    code?: string;
    message?: string | null;
  },
): PostInsightsResponse {
  return {
    ok: options.ok ?? true,
    code: options.code,
    message: options.message ?? undefined,
    post_id: snapshot.postId,
    ig_media_id: snapshot.igMediaId,
    fetched_at: snapshot.fetchedAt,
    from_cache: options.fromCache,
    insights: snapshot.metrics,
    media: snapshot.media,
  };
}
