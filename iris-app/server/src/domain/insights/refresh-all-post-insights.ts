import type { AppContext } from "../../api/app-context.ts";
import { fetchPostInsights } from "./fetch-post-insights.ts";

export type RefreshAllPostInsightsInput = {
  limit?: number;
  delayMs?: number;
  force?: boolean;
  /** ISO — filtra posts por published_at. */
  since?: string | null;
  until?: string | null;
};

export type RefreshAllPostInsightsResult = {
  requested: number;
  refreshed: string[];
  failed: Array<{ post_id: string; error: string }>;
  skipped: string[];
  delay_ms: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function inPublishedWindow(
  publishedAt: string | null,
  since?: string | null,
  until?: string | null,
): boolean {
  if (!since && !until) {
    return true;
  }
  if (!publishedAt) {
    return false;
  }
  const ms = Date.parse(publishedAt);
  if (!Number.isFinite(ms)) {
    return false;
  }
  if (since) {
    const sinceMs = Date.parse(since);
    if (Number.isFinite(sinceMs) && ms < sinceMs) {
      return false;
    }
  }
  if (until) {
    const untilMs = Date.parse(until);
    if (Number.isFinite(untilMs) && ms > untilMs) {
      return false;
    }
  }
  return true;
}

export async function refreshAllPostInsights(
  ctx: AppContext,
  input: RefreshAllPostInsightsInput = {},
): Promise<RefreshAllPostInsightsResult> {
  const delayMs = Math.min(Math.max(input.delayMs ?? 1_000, 250), 5_000);
  const force = input.force ?? true;

  const eligible = ctx.posts
    .list()
    .filter(
      (post) =>
        Boolean(post.igMediaId) &&
        (post.status === "published" || post.status === "monitored") &&
        inPublishedWindow(post.publishedAt, input.since, input.until),
    )
    .sort((left, right) => {
      const leftAt = left.publishedAt ?? left.scheduledAt ?? left.createdAt;
      const rightAt = right.publishedAt ?? right.scheduledAt ?? right.createdAt;
      return Date.parse(rightAt) - Date.parse(leftAt);
    });

  const max = input.limit
    ? Math.min(Math.max(Math.trunc(input.limit), 1), eligible.length)
    : eligible.length;
  const batch = eligible.slice(0, max);

  const refreshed: string[] = [];
  const failed: Array<{ post_id: string; error: string }> = [];
  const skipped: string[] = [];

  for (let index = 0; index < batch.length; index += 1) {
    const post = batch[index]!;

    try {
      const result = await fetchPostInsights(ctx, post.id, { force });
      if (result.ok) {
        refreshed.push(post.id);
      } else {
        failed.push({
          post_id: post.id,
          error: result.message ?? "insights_failed",
        });
      }
    } catch (error) {
      failed.push({
        post_id: post.id,
        error: error instanceof Error ? error.message : "refresh failed",
      });
    }

    if (index < batch.length - 1) {
      await sleep(delayMs);
    }
  }

  if (eligible.length > batch.length) {
    for (const post of eligible.slice(batch.length)) {
      skipped.push(post.id);
    }
  }

  return {
    requested: batch.length,
    refreshed,
    failed,
    skipped,
    delay_ms: delayMs,
  };
}
