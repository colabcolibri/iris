import type { MetaTokenStore } from "../../ports/meta-token-store.ts";
import type {
  MediaInsightMetric,
  MetaInsightsReader,
} from "../../ports/meta-insights-reader.ts";
import { STANDARD_MEDIA_INSIGHT_METRICS } from "../../domain/meta/media-insight-metrics.ts";

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

export function createGraphApiInsightsReader(
  deps: GraphApiInsightsReaderDeps,
): MetaInsightsReader {
  const fetchFn = deps.config.fetchImpl ?? fetch;
  const version = deps.config.graphApiVersion ?? "v21.0";
  const base = `https://graph.instagram.com/${version}`;

  async function fetchMetricBatch(
    igMediaId: string,
    metrics: string[],
    token: string,
  ): Promise<MediaInsightMetric[]> {
    const url = new URL(`${base}/${igMediaId}/insights`);
    url.searchParams.set("metric", metrics.join(","));
    url.searchParams.set("access_token", token);

    const response = await fetchFn(url.toString());
    const json = (await response.json()) as GraphInsightsResponse;

    if (!response.ok || json.error) {
      throw new Error(json.error?.message ?? `Meta API error (${response.status})`);
    }

    return mapInsightRows(json.data ?? []);
  }

  return {
    async getMediaInsights(igMediaId, metrics = [...STANDARD_MEDIA_INSIGHT_METRICS]) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      try {
        return await fetchMetricBatch(igMediaId, metrics, token);
      } catch (batchError) {
        const collected: MediaInsightMetric[] = [];

        for (const metric of metrics) {
          try {
            const rows = await fetchMetricBatch(igMediaId, [metric], token);
            collected.push(...rows);
          } catch {
            // métrica indisponível para este tipo de mídia — ignora
          }
        }

        if (collected.length === 0) {
          throw batchError;
        }

        return collected;
      }
    },
  };
}
