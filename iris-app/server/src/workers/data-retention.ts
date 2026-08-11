import type { AppContext } from "../api/app-context.ts";

export type DataRetentionOptions = {
  intervalMs?: number;
  retentionDays?: number;
  onTickError?: (error: unknown) => void;
};

export type DataRetentionResult = {
  webhookEventsDeleted: number;
};

export function runDataRetention(
  ctx: AppContext,
  retentionDays: number,
): DataRetentionResult {
  const days = Math.max(1, retentionDays);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  return {
    webhookEventsDeleted: ctx.webhookEvents.deleteOlderThan(cutoff),
  };
}

export function startDataRetention(
  ctx: AppContext,
  options: DataRetentionOptions = {},
): () => void {
  const intervalMs =
    options.intervalMs ?? Number(process.env.IRIS_RETENTION_TICK_MS ?? 24 * 60 * 60 * 1000);
  const retentionDays =
    options.retentionDays ?? Number(process.env.IRIS_RETENTION_DAYS ?? 90);

  let running = false;

  const tick = () => {
    if (running) {
      return;
    }

    running = true;

    try {
      runDataRetention(ctx, retentionDays);
    } catch (error) {
      options.onTickError?.(error);
    } finally {
      running = false;
    }
  };

  tick();

  const timer = setInterval(tick, intervalMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return () => {
    clearInterval(timer);
  };
}
