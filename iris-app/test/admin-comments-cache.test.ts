import { test } from "node:test";
import assert from "node:assert/strict";
import { formatRelativeTimeAgo } from "../admin/src/lib/format-relative-time.ts";
import {
  CommentsPostCache,
  isCacheFresh,
  COMMENTS_CACHE_STALE_MS,
} from "../admin/src/lib/comments-post-cache.ts";

test("formatRelativeTimeAgo returns human-readable pt-BR labels", () => {
  const now = Date.parse("2026-08-11T12:00:00.000Z");

  assert.equal(formatRelativeTimeAgo("2026-08-11T11:59:55.000Z", now), "agora");
  assert.equal(formatRelativeTimeAgo("2026-08-11T11:59:00.000Z", now), "há 1 minuto");
  assert.equal(formatRelativeTimeAgo("2026-08-11T11:30:00.000Z", now), "há 30 minutos");
  assert.equal(formatRelativeTimeAgo("2026-08-11T10:00:00.000Z", now), "há 2 horas");
});

test("CommentsPostCache stores and prunes per-post data", () => {
  const cache = new CommentsPostCache();

  cache.setComments("post-1", [{ id: "c1" } as never], 1000);
  cache.setInsights("post-1", { ok: true }, 2000);
  cache.setComments("post-2", [{ id: "c2" } as never], 3000);

  assert.equal(cache.getComments("post-1")?.data.length, 1);
  assert.equal(cache.getInsights("post-1")?.fetchedAt, 2000);

  cache.setLastSyncedAt("post-1", 5000);
  assert.equal(cache.getLastSyncedAt("post-1"), 5000);

  cache.pruneInactivePostIds(new Set(["post-1"]));
  assert.equal(cache.getComments("post-2"), undefined);
  assert.ok(cache.getComments("post-1"));
});

test("isCacheFresh respects stale window", () => {
  const fetchedAt = 1_000;
  assert.equal(isCacheFresh(fetchedAt, COMMENTS_CACHE_STALE_MS, fetchedAt + 30_000), true);
  assert.equal(isCacheFresh(fetchedAt, COMMENTS_CACHE_STALE_MS, fetchedAt + COMMENTS_CACHE_STALE_MS), false);
});
