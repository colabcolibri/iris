import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../http-server.ts";

const ADMIN = "browse-admin";
const AGENT = "browse-agent";

test("GET /api/meta/media/browse returns paginated media", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    if (url.hostname === "graph.instagram.com" && url.pathname.endsWith("/media")) {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "media-browse-1",
              caption: "Post para importar",
              timestamp: "2026-08-10T12:00:00+0000",
              media_url: "https://cdn.example/browse.jpg",
              like_count: 4,
              comments_count: 1,
            },
          ],
          paging: { cursors: { after: "next-page" } },
        }),
        { status: 200 },
      );
    }
    return originalFetch(input, init);
  }) as typeof fetch;

  const { server, stopScheduler } = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    agentToken: AGENT,
    metaAccessToken: "meta-token",
    igUserId: "ig-user-1",
    encryptionKey: "a".repeat(64),
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/meta/media/browse?limit=20`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      items: Array<{ ig_media_id: string; already_managed: boolean }>;
      next_cursor: string | null;
    };

    assert.equal(body.items[0]?.ig_media_id, "media-browse-1");
    assert.equal(body.items[0]?.already_managed, false);
    assert.equal(body.next_cursor, "next-page");
  } finally {
    globalThis.fetch = originalFetch;
    stopScheduler();
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
  }
});
