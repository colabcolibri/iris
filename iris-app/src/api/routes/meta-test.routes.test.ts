import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../http-server.ts";

const ADMIN = "meta-test-admin";
const AGENT = "meta-test-agent";

test("GET /api/meta/test/insights returns metrics for published media", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    if (url.hostname === "graph.instagram.com" && url.pathname.endsWith("/insights")) {
      return new Response(
        JSON.stringify({
          data: [{ name: "reach", period: "lifetime", values: [{ value: 3 }] }],
        }),
        { status: 200 },
      );
    }
    return originalFetch(input, init);
  }) as typeof fetch;

  const { server, stopScheduler, ctx } = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    agentToken: AGENT,
    metaAccessToken: "meta-token",
    igUserId: "ig-user-1",
    encryptionKey: "e".repeat(64),
  });

  const post = ctx.posts.create({ channel: "instagram", status: "published" });
  ctx.posts.update(post.id, {
    igMediaId: "media-99",
    publishedAt: new Date().toISOString(),
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/meta/test/insights`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      ok: boolean;
      media_id: string;
      insights: Array<{ name: string }>;
    };
    assert.equal(body.ok, true);
    assert.equal(body.media_id, "media-99");
    assert.equal(body.insights[0]?.name, "reach");
  } finally {
    globalThis.fetch = originalFetch;
    stopScheduler();
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
  }
});

test("GET /api/meta/test/conversations requires admin", async () => {
  const { server, stopScheduler } = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    agentToken: AGENT,
    metaAccessToken: "meta-token",
    igUserId: "ig-user-1",
    encryptionKey: "f".repeat(64),
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/meta/test/conversations`, {
      headers: { Authorization: `Bearer ${AGENT}` },
    });
    assert.equal(response.status, 403);
  } finally {
    stopScheduler();
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
  }
});
