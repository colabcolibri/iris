import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../adapters/sqlite/connection.ts";
import { runMigrations } from "../adapters/sqlite/migrate.ts";
import { createAppContext } from "../api/app-context.ts";
import type { MetaPublisher } from "../ports/meta-publisher.ts";
import { startPublishScheduler } from "./publish-scheduler.ts";

test("publish scheduler marks post published on success", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);

    const ctx = createAppContext({
      db,
      adminToken: "admin",
      agentToken: "agent",
      encryptionKey: "c".repeat(64),
      publicBaseUrl: "https://iris.example.com",
      publishUrlSecret: "secret",
      igUserId: "123",
    });

    const past = new Date(Date.now() - 60_000).toISOString();
    const post = ctx.posts.create({
      channel: "instagram",
      caption: "due post",
      status: "scheduled",
      scheduledAt: past,
    });

    ctx.assets.create({
      postId: post.id,
      sortOrder: 1,
      storagePath: `${post.id}/01.jpg`,
      mime: "image/jpeg",
    });

    const publisher: MetaPublisher = {
      async publish() {
        return { igMediaId: "ig-123" };
      },
    };

    const stop = startPublishScheduler(ctx, {
      intervalMs: 50,
      metaPublisher: publisher,
    });

    await new Promise((resolve) => setTimeout(resolve, 120));
    stop();

    const updated = ctx.posts.findById(post.id);
    assert.equal(updated?.status, "published");
    assert.equal(updated?.igMediaId, "ig-123");
    assert.ok(updated?.publishedAt);
  } finally {
    db.close();
  }
});

test("publish scheduler marks post failed on publisher error", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);

    const ctx = createAppContext({
      db,
      adminToken: "admin",
      agentToken: "agent",
      encryptionKey: "c".repeat(64),
      publicBaseUrl: "https://iris.example.com",
      publishUrlSecret: "secret",
      igUserId: "123",
    });

    const past = new Date(Date.now() - 60_000).toISOString();
    const post = ctx.posts.create({
      channel: "instagram",
      status: "scheduled",
      scheduledAt: past,
    });

    ctx.assets.create({
      postId: post.id,
      sortOrder: 1,
      storagePath: `${post.id}/01.jpg`,
      mime: "image/jpeg",
    });

    const publisher: MetaPublisher = {
      async publish() {
        throw new Error("meta rate limit");
      },
    };

    const stop = startPublishScheduler(ctx, {
      intervalMs: 50,
      metaPublisher: publisher,
    });

    await new Promise((resolve) => setTimeout(resolve, 120));
    stop();

    const updated = ctx.posts.findById(post.id);
    assert.equal(updated?.status, "failed");
    assert.match(updated?.errorMessage ?? "", /meta rate limit/);
  } finally {
    db.close();
  }
});
