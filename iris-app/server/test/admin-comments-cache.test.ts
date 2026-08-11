import { test } from "node:test";
import assert from "node:assert/strict";
import { formatRelativeTimeAgo } from "../../admin/src/lib/format-relative-time.ts";
import {
  CommentsPostCache,
  derivePostCountsFromComments,
  isCacheFresh,
  patchPostSummaryCounts,
  COMMENTS_CACHE_STALE_MS,
  POSTS_CACHE_STALE_MS,
} from "../../admin/src/lib/comments-post-cache.ts";

test("formatRelativeTimeAgo returns human-readable pt-BR labels", () => {
  const now = Date.parse("2026-08-11T12:00:00.000Z");

  assert.equal(formatRelativeTimeAgo("2026-08-11T11:59:55.000Z", now), "agora");
  assert.equal(formatRelativeTimeAgo("2026-08-11T11:59:00.000Z", now), "há 1 minuto");
  assert.equal(formatRelativeTimeAgo("2026-08-11T11:30:00.000Z", now), "há 30 minutos");
  assert.equal(formatRelativeTimeAgo("2026-08-11T10:00:00.000Z", now), "há 2 horas");
});

test("derivePostCountsFromComments ignores deleted comments for totals", () => {
  const counts = derivePostCountsFromComments([
    { id: "1", status: "pending", deleted_at: null } as never,
    { id: "2", status: "replied", deleted_at: "2026-08-11T00:00:00.000Z" } as never,
    { id: "3", status: "pending", deleted_at: null } as never,
  ]);

  assert.equal(counts.comments_count, 2);
  assert.equal(counts.pending_count, 2);
});

test("patchPostSummaryCounts updates only the target post", () => {
  const posts = [
    { post_id: "a", comments_count: 1, pending_count: 1 } as never,
    { post_id: "b", comments_count: 4, pending_count: 2 } as never,
  ];

  const patched = patchPostSummaryCounts(posts, "b", {
    comments_count: 5,
    pending_count: 1,
  });

  assert.notEqual(patched, posts);
  assert.equal(patched[1]?.comments_count, 5);
  assert.equal(patched[0], posts[0]);
});

test("CommentsPostCache stores and prunes per-post data", () => {
  const cache = new CommentsPostCache();

  cache.setComments("post-1", [{ id: "c1" } as never], 1000);
  cache.setInsights("post-1", { ok: true }, 2000);
  cache.setComments("post-2", [{ id: "c2" } as never], 3000);

  assert.equal(cache.getComments("post-1")?.data.length, 1);
  assert.equal(cache.getInsights("post-1")?.fetchedAt, 2000);

  cache.setPosts([{ post_id: "post-1" } as never], 4000);
  assert.equal(cache.getPosts()?.data.length, 1);

  cache.pruneInactivePostIds(new Set(["post-1"]));
  assert.equal(cache.getComments("post-2"), undefined);
  assert.ok(cache.getComments("post-1"));
});

test("isCacheFresh respects stale window", () => {
  const fetchedAt = 1_000;
  assert.equal(isCacheFresh(fetchedAt, COMMENTS_CACHE_STALE_MS, fetchedAt + 30_000), true);
  assert.equal(isCacheFresh(fetchedAt, COMMENTS_CACHE_STALE_MS, fetchedAt + COMMENTS_CACHE_STALE_MS), false);
  assert.equal(isCacheFresh(fetchedAt, POSTS_CACHE_STALE_MS, fetchedAt + 30_000), true);
});
