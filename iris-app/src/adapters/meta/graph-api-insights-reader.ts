import type { MetaTokenStore } from "../../ports/meta-token-store.ts";
import type {
  MediaInsightMetric,
  MetaInsightsReader,
} from "../../ports/meta-insights-reader.ts";

export type GraphApiInsightsReaderConfig = {
  graphApiVersion?: string;
  fetchImpl?: typeof fetch;
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

const DEFAULT_METRICS = [
  "impressions",
  "reach",
  "likes",
  "comments",
  "saved",
];

export function createGraphApiInsightsReader(
  deps: GraphApiInsightsReaderDeps,
): MetaInsightsReader {
  const fetchFn = deps.config.fetchImpl ?? fetch;
  const version = deps.config.graphApiVersion ?? "v21.0";
  const base = `https://graph.instagram.com/${version}`;

  return {
    async getMediaInsights(igMediaId, metrics = DEFAULT_METRICS) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      const url = new URL(`${base}/${igMediaId}/insights`);
      url.searchParams.set("metric", metrics.join(","));
      url.searchParams.set("access_token", token);

      const response = await fetchFn(url.toString());
      const json = (await response.json()) as GraphInsightsResponse;

      if (!response.ok || json.error) {
        throw new Error(json.error?.message ?? `Meta API error (${response.status})`);
      }

      return (json.data ?? []).map((row) => ({
        name: row.name ?? "unknown",
        period: row.period ?? "lifetime",
        values: (row.values ?? []).map((entry) => ({
          value: typeof entry.value === "number" ? entry.value : 0,
        })),
      })) satisfies MediaInsightMetric[];
    },
  };
}
