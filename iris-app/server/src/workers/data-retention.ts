import type { AppContext } from "../api/app-context.ts";
import { purgeMessageHistory } from "../domain/messages/purge-message-history.ts";

export type DataRetentionOptions = {
  intervalMs?: number;
  retentionDays?: number;
  onTickError?: (error: unknown) => void;
};

export type DataRetentionResult = {
  webhookEventsDeleted: number;
  messagesDeleted: number;
  conversationsDeleted: number;
};

export function runDataRetention(
  ctx: AppContext,
  retentionDays: number,
): DataRetentionResult {
  const days = Math.max(1, retentionDays);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const messagePurge = purgeMessageHistory({ messages: ctx.messages });

  return {
    webhookEventsDeleted: ctx.webhookEvents.deleteOlderThan(cutoff),
    messagesDeleted: messagePurge.messagesDeleted,
    conversationsDeleted: messagePurge.conversationsDeleted,
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
