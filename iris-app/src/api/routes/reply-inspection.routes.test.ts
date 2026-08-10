import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../http-server.ts";

const ADMIN = "inspection-admin";
const AGENT = "inspection-agent";

async function withServer(
  run: (baseUrl: string, ctx: ReturnType<typeof createServer>["ctx"]) => Promise<void>,
): Promise<void> {
  const handle = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    agentToken: AGENT,
    metaAccessToken: "meta-token",
    encryptionKey: "e".repeat(64),
    publicBaseUrl: "https://iris.example",
    publishUrlSecret: "publish-secret",
  });

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
  }
}

test("GET reply-inspection returns post context and thread for admin", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = ctx.posts.create({
      channel: "instagram",
      caption: "Legenda longa para inspeção do operador no admin",
    });
    ctx.posts.update(post.id, { autoReplyEnabled: true });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-inspect-1",
      postId: post.id,
      text: "primeira mensagem",
      authorUsername: "fan",
    });

    ctx.comments.createReply({
      commentId: comment.id,
      sentText: "resposta da marca",
      status: "sent",
    });

    const unauthorized = await fetch(`${baseUrl}/api/posts/${post.id}/reply-inspection`);
    assert.equal(unauthorized.status, 401);

    const response = await fetch(`${baseUrl}/api/posts/${post.id}/reply-inspection`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      auto_reply_enabled: boolean;
      post_context: { caption_truncated: string | null; assets: unknown[] };
      comments: Array<{ id: string; thread: Array<{ is_brand_reply: boolean }> }>;
    };

    assert.equal(body.auto_reply_enabled, true);
    assert.ok(body.post_context.caption_truncated);
    assert.equal(body.comments.length, 1);
    assert.equal(body.comments[0]?.id, comment.id);
    assert.ok(body.comments[0]?.thread.some((entry) => entry.is_brand_reply));
  });
});

test("GET reply-inspection returns 404 for missing post", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/posts/missing/reply-inspection`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(response.status, 404);
  });
});
