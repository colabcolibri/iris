import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../../http-server.ts";

const ADMIN = "activity-admin";

async function withServer(
  run: (baseUrl: string, ctx: ReturnType<typeof createServer>["ctx"]) => Promise<void>,
): Promise<void> {
  const handle = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    agentToken: "activity-agent",
    metaAppSecret: "secret",
    metaWebhookVerifyToken: "verify",
    metaAccessToken: "meta-token",
    igUserId: "ig-user",
    encryptionKey: "e".repeat(64),
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

function seedManagedPost(ctx: ReturnType<typeof createServer>["ctx"]) {
  const post = ctx.posts.create({
    channel: "instagram",
    status: "published",
    caption: "Legenda do post de teste",
  });
  ctx.posts.update(post.id, {
    igMediaId: "media-activity-1",
    publishedAt: new Date().toISOString(),
  });
  return post;
}

test("GET /api/comments/activity requires admin auth", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/comments/activity?kind=pending_approval`);
    assert.equal(response.status, 401);
  });
});

test("GET /api/comments/activity validates kind", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/comments/activity?kind=invalid`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(response.status, 422);
  });
});

test("GET /api/comments/activity returns pending approval drafts", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = seedManagedPost(ctx);
    const comment = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-pending-1",
      postId: post.id,
      authorUsername: "fan",
      text: "Quero saber mais sobre o produto",
    }).comment;
    ctx.comments.upsertDraft(comment.id, "Olá! Obrigado pelo interesse.");

    const response = await fetch(
      `${baseUrl}/api/comments/activity?kind=pending_approval`,
      { headers: { Authorization: `Bearer ${ADMIN}` } },
    );
    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      kind: string;
      items: Array<{
        comment_id: string;
        post_id: string;
        draft_text_preview: string | null;
      }>;
    };

    assert.equal(body.kind, "pending_approval");
    assert.equal(body.items.length, 1);
    assert.equal(body.items[0]?.comment_id, comment.id);
    assert.equal(body.items[0]?.post_id, post.id);
    assert.match(body.items[0]?.draft_text_preview ?? "", /interesse/);
  });
});

test("GET /api/comments/activity returns recent public comments", async () => {
  await withServer(async (baseUrl, ctx) => {
    ctx.metaConnectionStore.upsert({
      igUserId: "ig-user",
      igUsername: "minhamarca",
      pageId: "page-1",
      pageName: "Marca",
      connectedAt: new Date().toISOString(),
    });

    const post = seedManagedPost(ctx);
    const publicComment = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-public-1",
      postId: post.id,
      authorUsername: "cliente",
      text: "Adorei o conteúdo",
    }).comment;
    ctx.comments.upsertFromWebhook({
      igCommentId: "ig-brand-1",
      postId: post.id,
      authorUsername: "minhamarca",
      text: "Resposta da marca no IG",
    });

    const response = await fetch(
      `${baseUrl}/api/comments/activity?kind=recent_public&limit=10`,
      { headers: { Authorization: `Bearer ${ADMIN}` } },
    );
    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      items: Array<{ comment_id: string; author_username: string | null }>;
    };

    assert.equal(body.items.length, 1);
    assert.equal(body.items[0]?.comment_id, publicComment.id);
    assert.equal(body.items[0]?.author_username, "cliente");
  });
});

test("GET /api/comments/activity returns recent iris replies", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = seedManagedPost(ctx);
    const comment = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-reply-target",
      postId: post.id,
      authorUsername: "fan",
      text: "Qual o preço?",
    }).comment;
    ctx.comments.createReply({
      commentId: comment.id,
      status: "sent",
      sentText: "Enviamos os detalhes no direct.",
    });
    ctx.comments.markReplied(comment.id);

    const response = await fetch(
      `${baseUrl}/api/comments/activity?kind=recent_iris`,
      { headers: { Authorization: `Bearer ${ADMIN}` } },
    );
    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      items: Array<{
        comment_id: string;
        sent_text_preview: string | null;
      }>;
    };

    assert.equal(body.items.length, 1);
    assert.equal(body.items[0]?.comment_id, comment.id);
    assert.match(body.items[0]?.sent_text_preview ?? "", /direct/);
  });
});

test("GET /api/comments/activity clamps limit to maximum", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = seedManagedPost(ctx);
    for (let index = 0; index < 55; index += 1) {
      ctx.comments.upsertFromWebhook({
        igCommentId: `ig-limit-${index}`,
        postId: post.id,
        authorUsername: `user-${index}`,
        text: `Comentário ${index}`,
      });
    }

    const response = await fetch(
      `${baseUrl}/api/comments/activity?kind=recent_public&limit=999`,
      { headers: { Authorization: `Bearer ${ADMIN}` } },
    );
    assert.equal(response.status, 200);

    const body = (await response.json()) as { items: unknown[] };
    assert.equal(body.items.length, 50);
  });
});
