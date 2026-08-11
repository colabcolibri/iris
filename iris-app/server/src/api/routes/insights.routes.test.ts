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
