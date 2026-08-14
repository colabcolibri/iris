import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import { enqueueCommentReply } from "./enqueue-comment-reply.ts";
import {
  isCommentWithinReplyMaxAge,
  resolveCommentOccurredAt,
} from "./comment-reply-max-age.ts";
import { skipStalePendingCommentsForPost } from "./skip-stale-pending-comments.ts";
import type { Comment } from "./comment.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import { createHarnessLlmMock } from "../../test-utils/harness-llm-mock.ts";

function sampleComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: "c1",
    igCommentId: "ig-1",
    postId: "post-1",
    parentIgCommentId: null,
    authorUsername: "fan",
    text: "oi",
    status: "pending",
    errorMessage: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    igTimestamp: "2026-08-01T10:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

test("isCommentWithinReplyMaxAge uses ig_timestamp when available", () => {
  const now = new Date("2026-08-16T10:00:00.000Z");
  const recent = sampleComment({ igTimestamp: "2026-08-10T10:00:00.000Z" });
  const old = sampleComment({ igTimestamp: "2026-07-01T10:00:00.000Z" });

  assert.equal(isCommentWithinReplyMaxAge(recent, 15, now), true);
  assert.equal(isCommentWithinReplyMaxAge(old, 15, now), false);
});

test("resolveCommentOccurredAt falls back to created_at", () => {
  const comment = sampleComment({ igTimestamp: null });
  assert.equal(
    resolveCommentOccurredAt(comment).toISOString(),
    "2026-08-01T10:00:00.000Z",
  );
});

test("enqueueCommentReply skips and marks old comments", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "d".repeat(64),
      metaAccessToken: "meta",
    });

    ctx.appSettingsStore.upsert({
      timezone: "America/Sao_Paulo",
      replyMode: "auto",
      autoReplyEnabled: true,
      replyDelaySeconds: 0,
      replyMaxAgeDays: 15,
      autoMonitorEnabled: true,
      autoMonitorIntervalSeconds: 300,
    });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      igMediaId: "media-old",
      publishedAt: new Date().toISOString(),
      replyMode: "auto",
    });

    const { comment } = ctx.comments.upsertFromWebhook({
      igCommentId: "ig-old-1",
      postId: post.id,
      text: "pergunta antiga",
      igTimestamp: "2026-01-01T10:00:00.000Z",
    });

    const llm = createHarnessLlmMock({ draftText: "ok" });
    (ctx as { resolveLlmCompleter: () => LlmCompleter | null }).resolveLlmCompleter =
      () => llm;

    const scheduled = enqueueCommentReply(ctx, comment.id);
    assert.equal(scheduled, false);

    const updated = ctx.comments.findById(comment.id);
    assert.equal(updated?.status, "skipped");
    assert.match(updated?.errorMessage ?? "", /older than 15 days/);
    assert.equal(ctx.comments.listPendingForAgentReply().length, 0);
  } finally {
    db.close();
  }
});

test("skipStalePendingCommentsForPost marks pending comments outside max age", () => {
  const recent = sampleComment({
    id: "recent",
    igTimestamp: "2026-08-10T10:00:00.000Z",
  });
  const old = sampleComment({
    id: "old",
    igTimestamp: "2026-01-01T10:00:00.000Z",
  });
  const store = new Map([
    ["recent", recent],
    ["old", old],
  ]);

  const skipped = skipStalePendingCommentsForPost("post-1", "colabcolibri", {
    listByPostId: () => [...store.values()],
    markSkipped: (id, message) => {
      const row = store.get(id);
      if (!row) return null;
      const updated = { ...row, status: "skipped" as const, errorMessage: message ?? null };
      store.set(id, updated);
      return updated;
    },
    replyMaxAgeDays: 15,
  });

  assert.equal(skipped, 1);
  assert.equal(store.get("recent")?.status, "pending");
  assert.equal(store.get("old")?.status, "skipped");
});
