import type { AppContext } from "../../api/app-context.ts";
import { ValidationError } from "../../api/json.ts";
import {
  getMetaReadiness,
  MetaNotConnectedError,
} from "../meta/meta-readiness.ts";
import { STANDARD_ACCOUNT_INSIGHT_METRICS } from "../meta/media-insight-metrics.ts";
import type { MediaInsightMetric } from "../../ports/meta-insights-reader.ts";

export type FetchAccountInsightsInput = {
  period?: string;
  /** ISO date/time or unix seconds string/number. */
  since?: string | number | null;
  until?: string | number | null;
  metrics?: string[] | null;
};

export type AccountInsightsResponse = {
  ok: boolean;
  ig_user_id: string;
  period: string;
  since: number | null;
  until: number | null;
  fetched_at: string;
  insights: MediaInsightMetric[];
};

function toUnixSeconds(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? Math.floor(value / 1000) : Math.floor(value);
  }
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && String(value).trim().match(/^\d+$/)) {
    return asNumber > 1_000_000_000_000
      ? Math.floor(asNumber / 1000)
      : Math.floor(asNumber);
  }
  const ms = Date.parse(String(value));
  if (!Number.isFinite(ms)) {
    return undefined;
  }
  return Math.floor(ms / 1000);
}

export async function fetchAccountInsights(
  ctx: AppContext,
  input: FetchAccountInsightsInput = {},
): Promise<AccountInsightsResponse> {
  const readiness = getMetaReadiness(ctx);
  if (!readiness.ready) {
    throw new MetaNotConnectedError(readiness);
  }

  const igUserId = ctx.metaConnectionStore.get()?.igUserId;
  if (!igUserId) {
    throw new ValidationError("IG user id not configured");
  }

  const period = (input.period?.trim() || "day").toLowerCase();
  const since = toUnixSeconds(input.since);
  const until = toUnixSeconds(input.until);
  const metrics =
    input.metrics && input.metrics.length > 0
      ? input.metrics
      : [...STANDARD_ACCOUNT_INSIGHT_METRICS];

  const insights = await ctx.metaInsightsReader.getAccountInsights({
    metrics,
    period,
    since,
    until,
  });

  return {
    ok: true,
    ig_user_id: igUserId,
    period,
    since: since ?? null,
    until: until ?? null,
    fetched_at: new Date().toISOString(),
    insights,
  };
}
