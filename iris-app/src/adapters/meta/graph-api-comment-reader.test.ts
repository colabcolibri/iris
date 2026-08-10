import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraphApiCommentReader } from "./graph-api-comment-reader.ts";

test("graph api comment reader fetches recent media and comments", async () => {
  const calls: string[] = [];

  const reader = createGraphApiCommentReader({
    metaTokenStore: {
      getActiveToken() {
        return "token-123";
      },
      upsertToken() {
        return undefined;
      },
      clear() {
        return undefined;
      },
    },
    config: {
      resolveIgUserId: () => "ig-user-1",
      graphApiVersion: "v21.0",
      async fetchImpl(input) {
        const url = typeof input === "string" ? input : input.toString();
        calls.push(url);

        if (url.includes("/ig-user-1/media") || url.includes("/me/media")) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  id: "media-1",
                  caption: "Legenda",
                  timestamp: new Date().toISOString(),
                  comments_count: 2,
                },
              ],
            }),
            { status: 200 },
          );
        }

        if (url.includes("/media-1/comments")) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  id: "comment-1",
                  text: "Oi",
                  from: { username: "fan" },
                  timestamp: new Date().toISOString(),
                  replies: {
                    data: [
                      {
                        id: "comment-2",
                        text: "Reply",
                        from: { username: "fan2" },
                        timestamp: new Date().toISOString(),
                        parent_id: "comment-1",
                      },
                    ],
                  },
                },
              ],
            }),
            { status: 200 },
          );
        }

        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      },
    },
  });

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const media = await reader.listRecentMediaWithComments(since);
  assert.equal(media.length, 1);
  assert.equal(media[0]?.igMediaId, "media-1");
  assert.equal(media[0]?.reportedCommentsCount, 2);
  assert.equal(media[0]?.comments.length, 2);
  assert.equal(media[0]?.comments[1]?.parentIgCommentId, "comment-1");
  assert.equal(media[0]?.comments[0]?.authorUsername, "fan");
  assert.ok(calls.some((call) => call.includes("/media")));
  assert.ok(calls.some((call) => call.includes("/comments")));
});

test("graph api comment reader fetches a single media by id", async () => {
  const calls: string[] = [];

  const reader = createGraphApiCommentReader({
    metaTokenStore: {
      getActiveToken() {
        return "token-123";
      },
      upsertToken() {
        return undefined;
      },
      clear() {
        return undefined;
      },
    },
    config: {
      resolveIgUserId: () => "ig-user-1",
      graphApiVersion: "v21.0",
      async fetchImpl(input) {
        const url = typeof input === "string" ? input : input.toString();
        calls.push(url);

        if (url.includes("/media-target?")) {
          return new Response(
            JSON.stringify({
              id: "media-target",
              caption: "Post único",
              timestamp: new Date().toISOString(),
              comments_count: 1,
            }),
            { status: 200 },
          );
        }

        if (url.includes("/media-target/comments")) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  id: "comment-target",
                  text: "só este post",
                  from: { username: "fan" },
                  timestamp: new Date().toISOString(),
                },
              ],
            }),
            { status: 200 },
          );
        }

        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      },
    },
  });

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const media = await reader.listRecentMediaWithComments(since, {
    igMediaId: "media-target",
  });

  assert.equal(media.length, 1);
  assert.equal(media[0]?.igMediaId, "media-target");
  assert.equal(media[0]?.comments.length, 1);
  assert.equal(media[0]?.comments[0]?.text, "só este post");
  assert.ok(calls.some((call) => call.includes("/media-target?")));
  assert.ok(calls.some((call) => call.includes("/media-target/comments")));
  assert.ok(!calls.some((call) => call.includes("/me/media")));
});

test("graph api comment reader skips media without comments", async () => {
  const calls: string[] = [];

  const reader = createGraphApiCommentReader({
    metaTokenStore: {
      getActiveToken() {
        return "token-123";
      },
      upsertToken() {
        return undefined;
      },
      clear() {
        return undefined;
      },
    },
    config: {
      resolveIgUserId: () => "ig-user-1",
      graphApiVersion: "v21.0",
      async fetchImpl(input) {
        const url = typeof input === "string" ? input : input.toString();
        calls.push(url);

        if (url.includes("/media-empty?")) {
          return new Response(
            JSON.stringify({
              id: "media-empty",
              caption: "Sem comentários",
              timestamp: new Date().toISOString(),
              comments_count: 0,
            }),
            { status: 200 },
          );
        }

        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      },
    },
  });

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const media = await reader.listRecentMediaWithComments(since, {
    igMediaId: "media-empty",
  });

  assert.equal(media.length, 0);
  assert.ok(!calls.some((call) => call.includes("/comments")));
});
