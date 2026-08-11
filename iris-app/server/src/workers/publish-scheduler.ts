import type { AppContext } from "../api/app-context.ts";
import type { MetaPublisher } from "../ports/meta-publisher.ts";
import { publishPostNow } from "../domain/posts/publish-post.ts";
import { isDueForPublish } from "../domain/posts/schedule.ts";

export type PublishSchedulerOptions = {
  intervalMs?: number;
  metaPublisher?: MetaPublisher;
  onTickError?: (error: unknown) => void;
};

export function startPublishScheduler(
  ctx: AppContext,
  options: PublishSchedulerOptions = {},
): () => void {
  const publisher = options.metaPublisher ?? ctx.metaPublisher;
  if (!publisher) {
    return () => undefined;
  }

  const intervalMs = options.intervalMs ?? Number(process.env.IRIS_PUBLISH_TICK_MS ?? 60_000);
  let running = false;

  const tick = async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const duePosts = ctx.posts
        .list({ status: "scheduled" })
        .filter((post) => isDueForPublish(post));

      for (const post of duePosts) {
        const assets = ctx.assets.listByPostId(post.id);
        if (assets.length < 1) {
          continue;
        }

        try {
          await publishPostNow(ctx, post.id, publisher);
        } catch {
          // publishPostNow already persisted failed status and notified SSE.
        }
      }
    } catch (error) {
      options.onTickError?.(error);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return () => {
    clearInterval(timer);
  };
}
