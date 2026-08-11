import type { AppContext } from "../api/app-context.ts";
import { getAppSettingsOrDefault } from "../adapters/sqlite/app-settings-repository.ts";
import { registerMonitoredPostsBatch } from "../domain/comments/register-monitored-posts-batch.ts";
import { AUTO_MONITOR_MEDIA_LIMIT_DEFAULT } from "../domain/settings/auto-monitor-settings.ts";

export type AutoMonitorMediaOptions = {
  intervalMs?: number;
  enabled?: boolean;
  limit?: number;
  onTickError?: (error: unknown) => void;
};

export type AutoMonitorMediaResult = {
  skipped: boolean;
  listed: number;
  imported: number;
  alreadyManaged: number;
  failed: number;
};

export async function runAutoMonitorMedia(
  ctx: AppContext,
  options: { enabled?: boolean; limit?: number } = {},
): Promise<AutoMonitorMediaResult> {
  const settings = getAppSettingsOrDefault(ctx.appSettingsStore);
  const enabled = options.enabled ?? settings.autoMonitorEnabled;
  if (!enabled) {
    return {
      skipped: true,
      listed: 0,
      imported: 0,
      alreadyManaged: 0,
      failed: 0,
    };
  }

  const limit = options.limit ?? AUTO_MONITOR_MEDIA_LIMIT_DEFAULT;
  const page = await ctx.metaCommentReader.listBrowsableMedia({ limit });
  const ids = page.items.map((item) => item.igMediaId).filter(Boolean);

  if (ids.length === 0) {
    return {
      skipped: false,
      listed: 0,
      imported: 0,
      alreadyManaged: 0,
      failed: 0,
    };
  }

  const result = await registerMonitoredPostsBatch(ids, {
    posts: ctx.posts,
    metaCommentReader: ctx.metaCommentReader,
  });

  const alreadyManaged = result.skipped.filter(
    (item) => item.reason === "already_managed",
  ).length;
  const failed = result.skipped.length - alreadyManaged;

  return {
    skipped: false,
    listed: ids.length,
    imported: result.imported.length,
    alreadyManaged,
    failed,
  };
}

export function startAutoMonitorMedia(
  ctx: AppContext,
  options: AutoMonitorMediaOptions = {},
): () => void {
  let stopped = false;
  let running = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const scheduleNext = () => {
    if (stopped) {
      return;
    }

    const settings = getAppSettingsOrDefault(ctx.appSettingsStore);
    const intervalMs =
      options.intervalMs ?? Math.max(1_000, settings.autoMonitorIntervalSeconds * 1000);

    timer = setTimeout(() => {
      void tick();
    }, intervalMs);

    if (typeof timer.unref === "function") {
      timer.unref();
    }
  };

  const tick = async () => {
    if (stopped) {
      return;
    }

    if (running) {
      scheduleNext();
      return;
    }

    running = true;

    try {
      await runAutoMonitorMedia(ctx, {
        enabled: options.enabled,
        limit: options.limit,
      });
    } catch (error) {
      options.onTickError?.(error);
    } finally {
      running = false;
      scheduleNext();
    }
  };

  void tick();

  return () => {
    stopped = true;
    clearTimer();
  };
}
