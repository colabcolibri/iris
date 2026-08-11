import type { MetaTokenStore } from "../../ports/meta-token-store.ts";
import type {
  MediaInsightMetric,
  MediaPageInsightItem,
  MetaInsightsReader,
} from "../../ports/meta-insights-reader.ts";
import {
  STANDARD_ACCOUNT_INSIGHT_METRICS,
  STANDARD_MEDIA_INSIGHT_METRICS,
} from "../../domain/meta/media-insight-metrics.ts";

export type GraphApiInsightsReaderConfig = {
  graphApiVersion?: string;
  fetchImpl?: typeof fetch;
  resolveIgUserId: () => string | null;
};

type GraphApiInsightsReaderDeps = {
  metaTokenStore: MetaTokenStore;
  config: GraphApiInsightsReaderConfig;
};

type GraphInsightsResponse = {
  data?: Array<{
    name?: string;
    period?: string;
    values?: Array<{ value?: number }>;
  }>;
  error?: { message?: string; code?: number };
};

type GraphMediaWithInsights = {
  id?: string;
  caption?: string | null;
  timestamp?: string | null;
  like_count?: number;
  comments_count?: number;
  insights?: GraphInsightsResponse;
};

type GraphMediaPageResponse = {
  data?: GraphMediaWithInsights[];
  paging?: { cursors?: { after?: string }; next?: string };
  error?: { message?: string };
};

function mapInsightRows(
  rows: NonNullable<GraphInsightsResponse["data"]>,
): MediaInsightMetric[] {
  return rows.map((row) => ({
    name: row.name ?? "unknown",
    period: row.period ?? "lifetime",
    values: (row.values ?? []).map((entry) => ({
      value: typeof entry.value === "number" ? entry.value : 0,
    })),
  }));
}

function inIsoWindow(
  timestamp: string | null | undefined,
  sinceIso?: string | null,
  untilIso?: string | null,
): boolean {
  if (!sinceIso && !untilIso) {
    return true;
  }
  if (!timestamp) {
    return false;
  }
  const ms = Date.parse(timestamp);
  if (!Number.isFinite(ms)) {
    return false;
  }
  if (sinceIso) {
    const since = Date.parse(sinceIso);
    if (Number.isFinite(since) && ms < since) {
      return false;
    }
  }
  if (untilIso) {
    const until = Date.parse(untilIso);
    if (Number.isFinite(until) && ms > until) {
      return false;
    }
  }
  return true;
}

export function createGraphApiInsightsReader(
  deps: GraphApiInsightsReaderDeps,
): MetaInsightsReader {
  const fetchFn = deps.config.fetchImpl ?? fetch;
  const version = deps.config.graphApiVersion ?? "v21.0";
  const base = `https://graph.instagram.com/${version}`;

  async function fetchMetricBatch(
    pathId: string,
    metrics: string[],
    token: string,
    extra?: { period?: string; since?: number; until?: number },
  ): Promise<MediaInsightMetric[]> {
    const url = new URL(`${base}/${pathId}/insights`);
    url.searchParams.set("metric", metrics.join(","));
    url.searchParams.set("access_token", token);
    if (extra?.period) {
      url.searchParams.set("period", extra.period);
    }
    if (typeof extra?.since === "number") {
      url.searchParams.set("since", String(extra.since));
    }
    if (typeof extra?.until === "number") {
      url.searchParams.set("until", String(extra.until));
    }

    const response = await fetchFn(url.toString());
    const json = (await response.json()) as GraphInsightsResponse;

    if (!response.ok || json.error) {
      throw new Error(json.error?.message ?? `Meta API error (${response.status})`);
    }

    return mapInsightRows(json.data ?? []);
  }

  async function fetchWithMetricFallback(
    pathId: string,
    metrics: string[],
    token: string,
    extra?: { period?: string; since?: number; until?: number },
  ): Promise<MediaInsightMetric[]> {
    try {
      return await fetchMetricBatch(pathId, metrics, token, extra);
    } catch (batchError) {
      const collected: MediaInsightMetric[] = [];

      for (const metric of metrics) {
        try {
          const rows = await fetchMetricBatch(pathId, [metric], token, extra);
          collected.push(...rows);
        } catch {
          // métrica indisponível — ignora
        }
      }

      if (collected.length === 0) {
        throw batchError;
      }

      return collected;
    }
  }

  return {
    async getMediaInsights(igMediaId, metrics = [...STANDARD_MEDIA_INSIGHT_METRICS]) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      return fetchWithMetricFallback(igMediaId, metrics, token);
    },

    async getAccountInsights(query) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      const igUserId = deps.config.resolveIgUserId();
      if (!igUserId) {
        throw new Error("IG user id not configured");
      }

      const metrics =
        query.metrics.length > 0
          ? query.metrics
          : [...STANDARD_ACCOUNT_INSIGHT_METRICS];

      return fetchWithMetricFallback(igUserId, metrics, token, {
        period: query.period,
        since: query.since,
        until: query.until,
      });
    },

    async listMediaPageWithInsights(query = {}) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      const metrics = query.metrics?.length
        ? query.metrics
        : [...STANDARD_MEDIA_INSIGHT_METRICS];
      const limit = Math.min(Math.max(query.limit ?? 25, 1), 50);
      const fields = [
        "id",
        "caption",
        "timestamp",
        "like_count",
        "comments_count",
        `insights.metric(${metrics.join(",")})`,
      ].join(",");

      const mediaUrl = new URL(`${base}/me/media`);
      mediaUrl.searchParams.set("fields", fields);
      mediaUrl.searchParams.set("limit", String(limit));
      mediaUrl.searchParams.set("access_token", token);
      if (query.after) {
        mediaUrl.searchParams.set("after", query.after);
      }

      const response = await fetchFn(mediaUrl.toString());
      const json = (await response.json()) as GraphMediaPageResponse;

      if (!response.ok || json.error) {
        throw new Error(
          json.error?.message ?? `Meta API error (${response.status})`,
        );
      }

      const items: MediaPageInsightItem[] = [];
      for (const media of json.data ?? []) {
        if (!media.id) {
          continue;
        }
        if (!inIsoWindow(media.timestamp, query.sinceIso, query.untilIso)) {
          continue;
        }

        items.push({
          igMediaId: media.id,
          caption: media.caption ?? null,
          timestamp: media.timestamp ?? null,
          likeCount: typeof media.like_count === "number" ? media.like_count : null,
          commentsCount:
            typeof media.comments_count === "number" ? media.comments_count : null,
          insights: mapInsightRows(media.insights?.data ?? []),
        });
      }

      return {
        items,
        nextCursor: json.paging?.cursors?.after ?? null,
      };
    },
  };
}
