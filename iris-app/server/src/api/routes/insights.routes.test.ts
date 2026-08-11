import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "../http-server.ts";
import type { MetaInsightsReader } from "../../ports/meta-insights-reader.ts";

const ADMIN = "integration-admin";
const AGENT = "integration-agent";

async function withServer(
  run: (baseUrl: string, ctx: ReturnType<typeof createServer>["ctx"]) => Promise<void>,
  options: { insightsReader?: MetaInsightsReader } = {},
): Promise<void> {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-insights-"));
  const handle = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    agentToken: AGENT,
    mediaRoot,
    metaAccessToken: "integration-meta-token",
    igUserId: "123456789",
  });

  if (options.insightsReader) {
    handle.ctx.metaInsightsReader = options.insightsReader;
  }

  await new Promise<void>((resolve) => {
    handle.server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = handle.server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl, handle.ctx);
  } finally {
    handle.stopScheduler();
    await new Promise<void>((resolve, reject) => {
      handle.server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
    await rm(mediaRoot, { recursive: true, force: true });
  }
}

test("GET post insights caches snapshot and history lists it", async () => {
  let calls = 0;
  const reader: MetaInsightsReader = {
    async getMediaInsights() {
      calls += 1;
      return [{ name: "reach", period: "lifetime", values: [{ value: calls }] }];
    },
    async getAccountInsights() {
      return [];
    },
    async listMediaPageWithInsights() {
      return { items: [], nextCursor: null };
    },
  };

  await withServer(async (baseUrl, ctx) => {
    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Insights cache",
      igMediaId: "media-cache-1",
      publishedAt: new Date().toISOString(),
    });

    const first = await fetch(`${baseUrl}/api/posts/${post.id}/insights`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(first.status, 200);
    const firstBody = (await first.json()) as {
      from_cache: boolean;
      insights: Array<{ values: Array<{ value: number }> }>;
    };
    assert.equal(firstBody.from_cache, false);
    assert.equal(firstBody.insights[0]?.values[0]?.value, 1);

    const second = await fetch(`${baseUrl}/api/posts/${post.id}/insights`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(second.status, 200);
    const secondBody = (await second.json()) as {
      from_cache: boolean;
      insights: Array<{ values: Array<{ value: number }> }>;
    };
    assert.equal(secondBody.from_cache, true);
    assert.equal(secondBody.insights[0]?.values[0]?.value, 1);
    assert.equal(calls, 1);

    const history = await fetch(`${baseUrl}/api/posts/${post.id}/insights/history`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(history.status, 200);
    const historyBody = (await history.json()) as { snapshots: unknown[] };
    assert.equal(historyBody.snapshots.length, 1);
  }, { insightsReader: reader });
});

test("POST refresh-all updates multiple published posts with delay", async () => {
  const reader: MetaInsightsReader = {
    async getMediaInsights(igMediaId) {
      return [{ name: "reach", period: "lifetime", values: [{ value: igMediaId.length }] }];
    },
    async getAccountInsights() {
      return [];
    },
    async listMediaPageWithInsights() {
      return { items: [], nextCursor: null };
    },
  };

  await withServer(async (baseUrl, ctx) => {
    ctx.posts.create({
      channel: "instagram",
      status: "published",
      igMediaId: "media-a",
      publishedAt: new Date().toISOString(),
    });
    ctx.posts.create({
      channel: "instagram",
      status: "published",
      igMediaId: "media-b",
      publishedAt: new Date().toISOString(),
    });

    const response = await fetch(`${baseUrl}/api/insights/refresh-all`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ limit: 2, delay_ms: 0 }),
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as { requested: number; refreshed: string[] };
    assert.equal(body.requested, 2);
    assert.equal(body.refreshed.length, 2);
  }, { insightsReader: reader });
});

test("GET account insights returns live metrics", async () => {
  const reader: MetaInsightsReader = {
    async getMediaInsights() {
      return [];
    },
    async getAccountInsights(query) {
      assert.equal(query.period, "day");
      return [
        { name: "reach", period: "day", values: [{ value: 42 }] },
      ];
    },
    async listMediaPageWithInsights() {
      return { items: [], nextCursor: null };
    },
  };

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/insights/account?period=day`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      ok: boolean;
      insights: Array<{ name: string; values: Array<{ value: number }> }>;
    };
    assert.equal(body.ok, true);
    assert.equal(body.insights[0]?.values[0]?.value, 42);
  }, { insightsReader: reader });
});

test("POST refresh-media-page updates matching managed posts only", async () => {
  const reader: MetaInsightsReader = {
    async getMediaInsights() {
      return [];
    },
    async getAccountInsights() {
      return [];
    },
    async listMediaPageWithInsights() {
      return {
        items: [
          {
            igMediaId: "media-managed",
            caption: "ok",
            timestamp: "2026-08-10T12:00:00.000Z",
            likeCount: 9,
            commentsCount: 2,
            insights: [
              { name: "likes", period: "lifetime", values: [{ value: 9 }] },
              { name: "reach", period: "lifetime", values: [{ value: 100 }] },
            ],
          },
          {
            igMediaId: "media-unknown",
            caption: "skip",
            timestamp: "2026-08-10T12:00:00.000Z",
            likeCount: 1,
            commentsCount: 0,
            insights: [],
          },
        ],
        nextCursor: "cursor-2",
      };
    },
  };

  await withServer(async (baseUrl, ctx) => {
    const post = ctx.posts.create({
      channel: "instagram",
      status: "monitored",
      igMediaId: "media-managed",
      publishedAt: "2026-08-10T12:00:00.000Z",
    });

    const response = await fetch(`${baseUrl}/api/insights/refresh-media-page`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ limit: 25 }),
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      refreshed: string[];
      unmatched_ig_media_ids: string[];
      next_cursor: string | null;
      meta_call_count: number;
    };
    assert.deepEqual(body.refreshed, [post.id]);
    assert.deepEqual(body.unmatched_ig_media_ids, ["media-unknown"]);
    assert.equal(body.next_cursor, "cursor-2");
    assert.equal(body.meta_call_count, 1);

    const updated = ctx.posts.findById(post.id);
    assert.equal(updated?.likeCount, 9);
    assert.equal(updated?.reportedCommentsCount, 2);
    assert.equal(ctx.postInsightsStore.findLatestByPostId(post.id)?.metrics[0]?.name, "likes");
  }, { insightsReader: reader });
});

test("POST refresh-all respects since/until on published_at", async () => {
  const seen: string[] = [];
  const reader: MetaInsightsReader = {
    async getMediaInsights(igMediaId) {
      seen.push(igMediaId);
      return [{ name: "reach", period: "lifetime", values: [{ value: 1 }] }];
    },
    async getAccountInsights() {
      return [];
    },
    async listMediaPageWithInsights() {
      return { items: [], nextCursor: null };
    },
  };

  await withServer(async (baseUrl, ctx) => {
    ctx.posts.create({
      channel: "instagram",
      status: "published",
      igMediaId: "media-old",
      publishedAt: "2026-07-01T00:00:00.000Z",
    });
    ctx.posts.create({
      channel: "instagram",
      status: "published",
      igMediaId: "media-new",
      publishedAt: "2026-08-10T00:00:00.000Z",
    });

    const response = await fetch(`${baseUrl}/api/insights/refresh-all`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        delay_ms: 0,
        since: "2026-08-01T00:00:00.000Z",
        until: "2026-08-31T23:59:59.999Z",
      }),
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as { requested: number; refreshed: string[] };
    assert.equal(body.requested, 1);
    assert.equal(body.refreshed.length, 1);
    assert.deepEqual(seen, ["media-new"]);
  }, { insightsReader: reader });
});

test("webhook list supports status and field filters", async () => {
  await withServer(async (baseUrl, ctx) => {
    ctx.webhookEvents.insert({
      payloadJson: '{"object":"instagram"}',
      signatureValid: true,
      processingStatus: "processed",
      object: "instagram",
      field: "comments",
    });
    ctx.webhookEvents.insert({
      payloadJson: '{"object":"instagram"}',
      signatureValid: true,
      processingStatus: "ignored",
      object: "instagram",
      field: "mentions",
    });

    const response = await fetch(
      `${baseUrl}/api/settings/webhook-events?limit=10&status=processed&field=comments`,
      { headers: { Authorization: `Bearer ${ADMIN}` } },
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as { events: Array<{ processing_status: string; field: string | null }> };
    assert.equal(body.events.length, 1);
    assert.equal(body.events[0]?.processing_status, "processed");
    assert.equal(body.events[0]?.field, "comments");
  });
});
