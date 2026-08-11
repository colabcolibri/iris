import type { AppContext } from "../app-context.ts";

export function resolveLatestInspectableMediaId(ctx: AppContext): string | null {
  const candidates = ctx.posts
    .list()
    .filter(
      (post) =>
        Boolean(post.igMediaId) &&
        (post.status === "published" || post.status === "monitored"),
    )
    .sort((left, right) => {
      const leftTime = Date.parse(left.publishedAt ?? left.scheduledAt ?? "") || 0;
      const rightTime = Date.parse(right.publishedAt ?? right.scheduledAt ?? "") || 0;
      return rightTime - leftTime;
    });

  return candidates[0]?.igMediaId ?? null;
}
