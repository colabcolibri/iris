import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createServer } from "../http-server.ts";

const ADMIN = "comments-admin";
const AGENT = "comments-agent";
const VERIFY_TOKEN = "verify-token-123";
const APP_SECRET = "meta-app-secret";

function signBody(body: string): string {
  const digest = createHmac("sha256", APP_SECRET).update(body).digest("hex");
  return `sha256=${digest}`;
}

async function withServer(
  run: (baseUrl: string, ctx: ReturnType<typeof createServer>["ctx"]) => Promise<void>,
): Promise<void> {
  const handle = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    agentToken: AGENT,
    metaAppSecret: APP_SECRET,
    metaWebhookVerifyToken: VERIFY_TOKEN,
    metaAccessToken: "meta-token",
    encryptionKey: "d".repeat(64),
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

test("meta webhook GET returns hub challenge", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/webhooks/meta?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=challenge-42`,
    );

    assert.equal(response.status, 200);
    assert.equal(await response.text(), "challenge-42");
  });
});

test("meta webhook POST persists comment and lists via API", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
    });
    ctx.posts.update(post.id, { igMediaId: "media-42" });

    const payload = JSON.stringify({
      object: "instagram",
      entry: [
        {
          changes: [
            {
              field: "comments",
              value: {
                id: "ig-comment-1",
                text: "muito bom",
                from: { username: "fan" },
                media: { id: "media-42" },
              },
            },
          ],
        },
      ],
    });

    const unsigned = await fetch(`${baseUrl}/webhooks/meta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    assert.equal(unsigned.status, 403);

    const signed = await fetch(`${baseUrl}/webhooks/meta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": signBody(payload),
      },
      body: payload,
    });
    assert.equal(signed.status, 200);

    const listResponse = await fetch(`${baseUrl}/api/posts/${post.id}/comments`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(listResponse.status, 200);

    const body = (await listResponse.json()) as {
      comments: Array<{ ig_comment_id: string; text: string; status: string }>;
    };
    assert.equal(body.comments.length, 1);
    assert.equal(body.comments[0]?.ig_comment_id, "ig-comment-1");
    assert.equal(body.comments[0]?.text, "muito bom");
    assert.equal(body.comments[0]?.status, "pending");
  });
});

test("POST comment reply marks comment replied with mock replier", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = ctx.posts.create({ channel: "instagram" });
    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-comment-reply",
      postId: post.id,
      text: "pergunta",
      authorUsername: "user",
    });

    ctx.metaCommentReplier = {
      async reply() {
        return undefined;
      },
    };

    const response = await fetch(`${baseUrl}/api/comments/${comment.id}/reply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "obrigado!" }),
    });

    assert.equal(response.status, 200);
    const updated = (await response.json()) as { status: string };
    assert.equal(updated.status, "replied");
  });
});

test("POST comment reply marks failed when meta replier throws", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = ctx.posts.create({ channel: "instagram" });
    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-comment-fail",
      postId: post.id,
      text: "oi",
    });

    ctx.metaCommentReplier = {
      async reply() {
        throw new Error("rate limit");
      },
    };

    const response = await fetch(`${baseUrl}/api/comments/${comment.id}/reply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "tentativa" }),
    });

    assert.equal(response.status, 200);
    const updated = (await response.json()) as {
      status: string;
      error_message: string;
    };
    assert.equal(updated.status, "failed");
    assert.match(updated.error_message, /rate limit/);
  });
});
