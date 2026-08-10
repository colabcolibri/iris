import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraphApiCommentReader } from "./graph-api-comment-reader.ts";

test("graph api comment reader lists browsable media with cursor", async () => {
  const calls: string[] = [];

  const fetchImpl = async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    calls.push(url.search);

    return new Response(
      JSON.stringify({
        data: [
          {
            id: "media-1",
            caption: "Primeira publicação",
            timestamp: "2026-08-10T12:00:00+0000",
            permalink: "https://www.instagram.com/p/abc/",
            media_type: "IMAGE",
            media_url: "https://cdn.example/1.jpg",
            like_count: 12,
            comments_count: 3,
          },
        ],
        paging: { cursors: { after: "cursor-2" } },
      }),
      { status: 200 },
    );
  };

  const reader = createGraphApiCommentReader({
    metaTokenStore: { getActiveToken: () => "token" },
    config: {
      fetchImpl: fetchImpl as typeof fetch,
      resolveIgUserId: () => "ig-user-1",
    },
  });

  const page = await reader.listBrowsableMedia({ limit: 20 });

  assert.equal(page.items.length, 1);
  assert.equal(page.items[0]?.igMediaId, "media-1");
  assert.equal(page.items[0]?.likeCount, 12);
  assert.equal(page.nextCursor, "cursor-2");
  assert.match(calls[0] ?? "", /limit=20/);
  assert.match(calls[0] ?? "", /like_count/);
});
