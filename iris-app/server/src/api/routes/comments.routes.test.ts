import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createServer } from "../http-server.ts";
import { processCommentReply } from "../../domain/comments/process-comment-reply.ts";
import { createHarnessLlmMock } from "../../test-utils/harness-llm-mock.ts";

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
    igUserId: "test-ig-user",
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
    assert.equal(ctx.webhookEvents.count(), 1);
    const unsignedEvent = ctx.webhookEvents.listRecent(1)[0];
    assert.equal(unsignedEvent?.signatureValid, false);
    assert.equal(unsignedEvent?.processingStatus, "failed");
    assert.equal(unsignedEvent?.errorMessage, "invalid signature");

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
    assert.equal(ctx.webhookEvents.count(), 2);

    const eventsResponse = await fetch(`${baseUrl}/api/settings/webhook-events?limit=5`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(eventsResponse.status, 200);
    const eventsBody = (await eventsResponse.json()) as {
      events: Array<{ processing_status: string; post_id: string | null; signature_valid: boolean }>;
    };
    assert.equal(eventsBody.events.length, 2);
    const processedEvent = eventsBody.events.find((event) => event.processing_status === "processed");
    assert.ok(processedEvent);
    assert.equal(processedEvent?.post_id, post.id);
    assert.equal(
      eventsBody.events.some((event) => !event.signature_valid),
      true,
    );
  });
});

test("meta webhook POST persists ignored event when media is unknown", async () => {
  await withServer(async (baseUrl, ctx) => {
    const payload = JSON.stringify({
      object: "instagram",
      entry: [
        {
          changes: [
            {
              field: "comments",
              value: {
                id: "ig-comment-unknown",
                text: "oi",
                media: { id: "media-missing" },
              },
            },
          ],
        },
      ],
    });

    const response = await fetch(`${baseUrl}/webhooks/meta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": signBody(payload),
      },
      body: payload,
    });
    assert.equal(response.status, 200);
    assert.equal(ctx.webhookEvents.count(), 1);

    const events = ctx.webhookEvents.listRecent(1);
    assert.equal(events[0]?.processingStatus, "ignored");
  });
});

test("meta webhook POST persists parent_id and re-upsert updates parent", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
    });
    ctx.posts.update(post.id, { igMediaId: "media-parent" });

    const initialPayload = JSON.stringify({
      object: "instagram",
      entry: [
        {
          changes: [
            {
              field: "comments",
              value: {
                id: "ig-comment-parent",
                text: "top level",
                from: { username: "fan" },
                media: { id: "media-parent" },
              },
            },
          ],
        },
      ],
    });

    const initial = await fetch(`${baseUrl}/webhooks/meta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": signBody(initialPayload),
      },
      body: initialPayload,
    });
    assert.equal(initial.status, 200);

    const updatedPayload = JSON.stringify({
      object: "instagram",
      entry: [
        {
          changes: [
            {
              field: "comments",
              value: {
                id: "ig-comment-parent",
                text: "top level corrigido",
                parent_id: "ig-root",
                from: { username: "fan" },
                media: { id: "media-parent" },
              },
            },
          ],
        },
      ],
    });

    const updated = await fetch(`${baseUrl}/webhooks/meta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": signBody(updatedPayload),
      },
      body: updatedPayload,
    });
    assert.equal(updated.status, 200);

    const listResponse = await fetch(`${baseUrl}/api/posts/${post.id}/comments`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    const body = (await listResponse.json()) as {
      comments: Array<{
        parent_ig_comment_id: string | null;
        text: string;
      }>;
    };

    assert.equal(body.comments.length, 1);
    assert.equal(body.comments[0]?.parent_ig_comment_id, "ig-root");
    assert.equal(body.comments[0]?.text, "top level corrigido");
  });
});

test("GET comments posts returns published posts with counts", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post comentários",
    });
    ctx.posts.update(post.id, {
      igMediaId: "media-comments",
      publishedAt: new Date().toISOString(),
    });
    ctx.comments.upsertFromWebhook({
      igCommentId: "ig-post-1",
      postId: post.id,
      text: "oi",
    });

    const response = await fetch(`${baseUrl}/api/comments/posts`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      posts: Array<{ post_id: string; comments_count: number }>;
    };

    assert.equal(body.posts.length, 1);
    assert.equal(body.posts[0]?.post_id, post.id);
    assert.equal(body.posts[0]?.comments_count, 1);
  });
});

test("GET post insights returns metrics for managed post", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    if (url.hostname === "graph.instagram.com" && url.pathname.endsWith("/insights")) {
      return new Response(
        JSON.stringify({
          data: [{ name: "reach", period: "lifetime", values: [{ value: 9 }] }],
        }),
        { status: 200 },
      );
    }
    if (url.hostname === "graph.instagram.com") {
      return new Response(
        JSON.stringify({
          id: "media-insights-post",
          caption: "Post insights",
          permalink: "https://www.instagram.com/p/abc/",
          media_type: "IMAGE",
          media_url: "https://cdn.example/full.jpg",
          thumbnail_url: "https://cdn.example/thumb.jpg",
        }),
        { status: 200 },
      );
    }
    return originalFetch(input, init);
  }) as typeof fetch;

  try {
    await withServer(async (baseUrl, ctx) => {
      const post = ctx.posts.create({
        channel: "instagram",
        status: "monitored",
        caption: "Post insights",
      });
      ctx.posts.update(post.id, {
        igMediaId: "media-insights-post",
        publishedAt: new Date().toISOString(),
      });

      const response = await fetch(`${baseUrl}/api/posts/${post.id}/insights`, {
        headers: { Authorization: `Bearer ${ADMIN}` },
      });

      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        ok: boolean;
        insights: Array<{ name: string }>;
        media: { source: string; items: Array<{ url: string }> };
      };

      assert.equal(body.ok, true);
      assert.equal(body.insights[0]?.name, "reach");
      assert.equal(body.media.source, "meta");
      assert.equal(body.media.items[0]?.url, "https://cdn.example/full.jpg");
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("POST comments sync upserts comments for one post", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post sync",
    });
    ctx.posts.update(post.id, { igMediaId: "media-sync-post" });

    ctx.metaCommentReader = {
      async listRecentMediaWithComments(_since, options) {
        if (options?.igMediaId === "media-sync-post") {
          return [
            {
              igMediaId: "media-sync-post",
              caption: "Post sync",
              timestamp: new Date().toISOString(),
              likeCount: null,
              reportedCommentsCount: 1,
              comments: [
                {
                  igCommentId: "ig-sync-post-1",
                  parentIgCommentId: null,
                  authorUsername: "fan",
                  text: "sync por post",
                  timestamp: new Date().toISOString(),
                },
              ],
            },
          ];
        }

        return [];
      },
    };

    const response = await fetch(`${baseUrl}/api/posts/${post.id}/comments/sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ADMIN}` },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      comments_fetched: number;
      comments: Array<{ text: string }>;
    };

    assert.equal(body.comments_fetched, 1);
    assert.equal(body.comments[0]?.text, "sync por post");
    assert.equal(ctx.comments.listByPostId(post.id).length, 1);
  });
});

test("POST comments reconcile sincroniza e marca comentários removidos no Instagram", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post reconcile deleted",
    });
    ctx.posts.update(post.id, { igMediaId: "media-reconcile-deleted" });

    ctx.comments.upsertFromWebhook({
      igCommentId: "ig-user-reconcile",
      postId: post.id,
      authorUsername: "fan",
      text: "pergunta",
      igTimestamp: "2026-08-10T10:00:00.000Z",
    });
    ctx.comments.upsertFromWebhook({
      igCommentId: "ig-brand-deleted",
      postId: post.id,
      parentIgCommentId: "ig-user-reconcile",
      authorUsername: "test-ig-user",
      text: "resposta apagada",
      igTimestamp: "2026-08-10T11:00:00.000Z",
    });

    ctx.metaCommentReader = {
      async listRecentMediaWithComments(_since, options) {
        if (options?.igMediaId === "media-reconcile-deleted") {
          return [
            {
              igMediaId: "media-reconcile-deleted",
              caption: "Post reconcile deleted",
              timestamp: new Date().toISOString(),
              likeCount: null,
              reportedCommentsCount: 1,
              comments: [
                {
                  igCommentId: "ig-user-reconcile",
                  parentIgCommentId: null,
                  authorUsername: "fan",
                  text: "pergunta",
                  timestamp: "2026-08-10T10:00:00.000Z",
                },
              ],
            },
          ];
        }
        return [];
      },
    };

    const response = await fetch(`${baseUrl}/api/posts/${post.id}/comments/reconcile`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ADMIN}` },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      marked_deleted: number;
      linked_count: number;
      comments: Array<{ ig_comment_id: string; deleted_at: string | null; status: string }>;
    };

    assert.equal(body.marked_deleted, 1);
    assert.equal(body.linked_count, 0);

    const user = body.comments.find((c) => c.ig_comment_id === "ig-user-reconcile");
    const brand = body.comments.find((c) => c.ig_comment_id === "ig-brand-deleted");
    assert.equal(user?.status, "pending");
    assert.equal(user?.deleted_at, null);
    assert.ok(brand?.deleted_at);
  });
});

test("GET comments inbox returns synced media", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post inbox",
    });
    ctx.posts.update(post.id, { igMediaId: "media-inbox" });

    ctx.metaCommentReader = {
      async listRecentMediaWithComments() {
        return [
          {
            igMediaId: "media-inbox",
            caption: "Post inbox",
            timestamp: new Date().toISOString(),
            likeCount: null,
              reportedCommentsCount: 1,
            comments: [
              {
                igCommentId: "ig-inbox-1",
                parentIgCommentId: null,
                authorUsername: "fan",
                text: "comentário inbox",
                timestamp: new Date().toISOString(),
              },
            ],
          },
        ];
      },
    };

    const response = await fetch(`${baseUrl}/api/comments/inbox?days=30&source=meta`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      media: Array<{
        post_id: string;
        comments: Array<{ iris_comment_id: string; text: string }>;
      }>;
    };

    assert.equal(body.media.length, 1);
    assert.equal(body.media[0]?.post_id, post.id);
    assert.equal(body.media[0]?.comments[0]?.text, "comentário inbox");
    assert.ok(body.media[0]?.comments[0]?.iris_comment_id);
  });
});

test("GET comments inbox filters by ig_media_id", async () => {
  await withServer(async (baseUrl, ctx) => {
    ctx.metaCommentReader = {
      async listRecentMediaWithComments(_since, options) {
        if (options?.igMediaId === "media-only") {
          return [
            {
              igMediaId: "media-only",
              caption: "Post filtrado",
              timestamp: new Date().toISOString(),
              likeCount: null,
              reportedCommentsCount: 1,
              comments: [
                {
                  igCommentId: "ig-only-1",
                  parentIgCommentId: null,
                  authorUsername: "fan",
                  text: "comentário único",
                  timestamp: new Date().toISOString(),
                },
              ],
            },
          ];
        }

        return [];
      },
    };

    const response = await fetch(
      `${baseUrl}/api/comments/inbox?ig_media_id=media-only&source=meta`,
      {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      media: Array<{ ig_media_id: string; comments: Array<{ text: string }> }>;
    };

    assert.equal(body.media.length, 1);
    assert.equal(body.media[0]?.comments[0]?.text, "comentário único");
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
        return {};
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

test("GET reply-context returns target comment and thread for agent", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Legenda do post",
    });
    ctx.posts.update(post.id, { igMediaId: "media-context" });

    const root = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-root",
      postId: post.id,
      text: "pergunta raiz",
      authorUsername: "fan",
    }).comment;

    const child = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-child",
      postId: post.id,
      parentIgCommentId: "ig-root",
      text: "resposta encadeada",
      authorUsername: "fan2",
    }).comment;

    const response = await fetch(`${baseUrl}/api/comments/${child.id}/reply-context`, {
      headers: { Authorization: `Bearer ${AGENT}` },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      target_comment: { id: string; text: string | null };
      thread: Array<{ depth: number }>;
      post: { caption: string | null; ig_media_id: string | null } | null;
      persona: { max_chars: number };
    };

    assert.equal(body.target_comment.id, child.id);
    assert.equal(body.target_comment.text, "resposta encadeada");
    assert.ok(body.thread.some((entry) => entry.depth > 0));
    assert.equal(body.post?.caption, "Legenda do post");
    assert.equal(body.post?.ig_media_id, "media-context");
    assert.ok(body.persona.max_chars > 0);
    assert.ok(root.id);
  });
});

test("GET reply-audit returns ordered steps for comment", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post audit",
      igMediaId: "media-audit",
      publishedAt: new Date().toISOString(),
      replyMode: "draft",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-audit-1",
      postId: post.id,
      text: "Pergunta",
    });

    await processCommentReply(ctx, comment.id, {
      trigger: "worker",
      llmCompleter: createHarnessLlmMock({ draftText: "Resposta auditada" }),
    });

    const response = await fetch(`${baseUrl}/api/comments/${comment.id}/reply-audit`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      agent_run_id: string;
      terminal_status: string;
      steps: Array<{ stage: string; verdict: string }>;
    };

    assert.ok(body.agent_run_id);
    assert.equal(body.terminal_status, "approved");
    assert.equal(body.steps.length, 3);
    assert.deepEqual(
      body.steps.map((step) => step.stage),
      ["triage", "draft", "verify"],
    );

    const missing = await fetch(`${baseUrl}/api/comments/missing-comment/reply-audit`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(missing.status, 404);
  });
});

test("GET agent-runs lists recent runs", async () => {
  await withServer(async (baseUrl, ctx) => {
    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post runs",
      igMediaId: "media-runs",
      publishedAt: new Date().toISOString(),
      replyMode: "draft",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-runs-1",
      postId: post.id,
      text: "Oi",
    });

    await processCommentReply(ctx, comment.id, {
      trigger: "worker",
      llmCompleter: createHarnessLlmMock({ draftText: "Resposta runs", replyTier: "simple" }),
    });

    const listResponse = await fetch(`${baseUrl}/api/agent-runs?limit=10`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(listResponse.status, 200);
    const listBody = (await listResponse.json()) as {
      items: Array<{ comment_id: string | null; reply_tier: string | null; step_count: number }>;
    };
    assert.ok(listBody.items.length >= 1);
    const item = listBody.items.find((row) => row.comment_id === comment.id);
    assert.ok(item);
    assert.equal(item?.reply_tier, "simple");
    assert.ok((item?.step_count ?? 0) >= 3);

    const runId = (item as { id: string }).id;
    const detailResponse = await fetch(`${baseUrl}/api/agent-runs/${runId}`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(detailResponse.status, 200);
    const detailBody = (await detailResponse.json()) as {
      comment_id: string;
      audit: { steps: Array<{ structured: unknown }> };
    };
    assert.equal(detailBody.comment_id, comment.id);
    assert.ok(detailBody.audit.steps.some((step) => step.structured));
  });
});

test("POST ai-reply generates draft for pending comment", async () => {
  await withServer(async (baseUrl, ctx) => {
    ctx.resolveLlmCompleter = () => createHarnessLlmMock({ draftText: "Draft via API" });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post ai-reply",
      igMediaId: "media-ai-reply",
      publishedAt: new Date().toISOString(),
      replyMode: "off",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-ai-reply-1",
      postId: post.id,
      text: "Pergunta API",
    });

    const response = await fetch(`${baseUrl}/api/comments/${comment.id}/ai-reply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "draft" }),
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as { draft_text: string | null; status: string };
    assert.equal(body.draft_text, "Draft via API");
    assert.equal(body.status, "pending");
  });
});

test("POST ai-reply draft works on already replied comment", async () => {
  await withServer(async (baseUrl, ctx) => {
    ctx.resolveLlmCompleter = () =>
      createHarnessLlmMock({ draftText: "Nova resposta manual" });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post replied",
      igMediaId: "media-replied-draft",
      publishedAt: new Date().toISOString(),
      replyMode: "off",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-replied-draft-1",
      postId: post.id,
      text: "Comentário já respondido",
    });

    ctx.comments.createReply({
      commentId: comment.id,
      sentText: "Resposta anterior",
      status: "sent",
      replyToIgCommentId: comment.igCommentId,
    });
    ctx.comments.markReplied(comment.id);

    const response = await fetch(`${baseUrl}/api/comments/${comment.id}/ai-reply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "draft" }),
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      draft_text: string | null;
      status: string;
      linked_reply_text: string | null;
    };
    assert.equal(body.draft_text, "Nova resposta manual");
    assert.equal(body.status, "replied");
    assert.equal(body.linked_reply_text, "Resposta anterior");
  });
});

test("DELETE draft removes stored draft", async () => {
  await withServer(async (baseUrl, ctx) => {
    ctx.resolveLlmCompleter = () => createHarnessLlmMock({ draftText: "Draft to remove" });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post draft delete",
      igMediaId: "media-draft-delete",
      publishedAt: new Date().toISOString(),
      replyMode: "draft",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-draft-delete-1",
      postId: post.id,
      text: "Pergunta",
    });

    const createResponse = await fetch(`${baseUrl}/api/comments/${comment.id}/ai-reply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "draft" }),
    });
    assert.equal(createResponse.status, 200);

    const deleteResponse = await fetch(`${baseUrl}/api/comments/${comment.id}/draft`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ADMIN}` },
    });

    assert.equal(deleteResponse.status, 200);
    const body = (await deleteResponse.json()) as { draft_text: string | null };
    assert.equal(body.draft_text, null);
    assert.equal(ctx.comments.findLatestDraft(comment.id), null);
  });
});

test("PATCH draft updates stored draft text", async () => {
  await withServer(async (baseUrl, ctx) => {
    ctx.resolveLlmCompleter = () => createHarnessLlmMock({ draftText: "Draft original" });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      caption: "Post draft patch",
      igMediaId: "media-draft-patch",
      publishedAt: new Date().toISOString(),
      replyMode: "draft",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-draft-patch-1",
      postId: post.id,
      text: "Pergunta",
    });

    await fetch(`${baseUrl}/api/comments/${comment.id}/ai-reply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "draft" }),
    });

    const patchResponse = await fetch(`${baseUrl}/api/comments/${comment.id}/draft`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${ADMIN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Draft editado" }),
    });

    assert.equal(patchResponse.status, 200);
    const body = (await patchResponse.json()) as { draft_text: string | null };
    assert.equal(body.draft_text, "Draft editado");
  });
});

test("meta webhook auto-registers unknown media then ingests comment", async () => {
  await withServer(async (baseUrl, ctx) => {
    ctx.metaCommentReader = {
      ...ctx.metaCommentReader,
      async fetchMediaMetadata(igMediaId: string) {
        if (igMediaId === "18614146732042397") {
          return {
            igMediaId: "18614146732042397",
            caption: "post externo",
            timestamp: "2026-08-11T12:00:00.000Z",
          };
        }
        throw new Error(`unexpected media ${igMediaId}`);
      },
    };

    const payload = JSON.stringify({
      object: "instagram",
      entry: [
        {
          changes: [
            {
              field: "comments",
              value: {
                id: "ig-lazy-1",
                text: "primeiro comentário",
                from: { username: "fan" },
                media: { id: "18614146732042397" },
              },
            },
          ],
        },
      ],
    });

    const response = await fetch(`${baseUrl}/webhooks/meta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": signBody(payload),
      },
      body: payload,
    });
    assert.equal(response.status, 200);

    const monitored = ctx.posts.findCommentableByIgMediaId("18614146732042397");
    assert.ok(monitored);
    assert.equal(monitored?.status, "monitored");
    assert.equal(ctx.comments.listByPostId(monitored!.id).length, 1);

    const secondPayload = JSON.stringify({
      object: "instagram",
      entry: [
        {
          changes: [
            {
              field: "comments",
              value: {
                id: "ig-lazy-2",
                text: "segundo",
                from: { username: "fan2" },
                media: { id: "18614146732042397" },
              },
            },
          ],
        },
      ],
    });

    const second = await fetch(`${baseUrl}/webhooks/meta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": signBody(secondPayload),
      },
      body: secondPayload,
    });
    assert.equal(second.status, 200);

    const again = ctx.posts.findByIgMediaId("18614146732042397");
    assert.equal(again?.id, monitored?.id);
    assert.equal(ctx.comments.listByPostId(monitored!.id).length, 2);
  });
});

test("meta webhook ignores comment when unknown media cannot be resolved", async () => {
  await withServer(async (baseUrl, ctx) => {
    ctx.metaCommentReader = {
      ...ctx.metaCommentReader,
      async fetchMediaMetadata() {
        throw new Error("media not found on account");
      },
    };

    const payload = JSON.stringify({
      object: "instagram",
      entry: [
        {
          changes: [
            {
              field: "comments",
              value: {
                id: "ig-orphan-1",
                text: "órfão",
                from: { username: "fan" },
                media: { id: "18000000000000001" },
              },
            },
          ],
        },
      ],
    });

    const response = await fetch(`${baseUrl}/webhooks/meta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": signBody(payload),
      },
      body: payload,
    });
    assert.equal(response.status, 200);
    assert.equal(ctx.posts.findByIgMediaId("18000000000000001"), null);
    assert.equal(ctx.comments.listByPostId("any").length, 0);

    const event = ctx.webhookEvents.listRecent(1)[0];
    assert.equal(event?.processingStatus, "ignored");
  });
});
