import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../adapters/sqlite/connection.ts";
import { runMigrations } from "../adapters/sqlite/migrate.ts";
import { createAppContext } from "../api/app-context.ts";
import type { MetaPublisher } from "../ports/meta-publisher.ts";
import { publishPostNow } from "./publish-post.ts";

test("publishPostNow marks post published on success", async () => {
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
      metaAccessToken: "meta-token",
      igUserId: "123",
    });

    const post = ctx.posts.create({
      channel: "instagram",
      caption: "now",
      status: "draft",
    });

    ctx.assets.create({
      postId: post.id,
      sortOrder: 1,
      storagePath: `${post.id}/01.jpg`,
      mime: "image/jpeg",
    });

    const publisher: MetaPublisher = {
      async publish() {
        return { igMediaId: "ig-now" };
      },
    };

    const updated = await publishPostNow(ctx, post.id, publisher);
    assert.equal(updated.status, "published");
    assert.equal(updated.igMediaId, "ig-now");
    assert.ok(updated.publishedAt);
  } finally {
    db.close();
  }
});

test("publishPostNow marks post failed when publisher throws", async () => {
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
      metaAccessToken: "meta-token",
      igUserId: "123",
    });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "scheduled",
      scheduledAt: new Date(Date.now() + 3_600_000).toISOString(),
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

    await assert.rejects(() => publishPostNow(ctx, post.id, publisher), /meta rate limit/);

    const updated = ctx.posts.findById(post.id);
    assert.equal(updated?.status, "failed");
    assert.match(updated?.errorMessage ?? "", /meta rate limit/);
  } finally {
    db.close();
  }
});

test("publishPostNow rejects published posts", async () => {
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
      metaAccessToken: "meta-token",
      igUserId: "123",
    });

    const post = ctx.posts.create({
      channel: "instagram",
      status: "published",
      publishedAt: new Date().toISOString(),
      igMediaId: "ig-existing",
    });

    const publisher: MetaPublisher = {
      async publish() {
        return { igMediaId: "ig-new" };
      },
    };

    await assert.rejects(
      () => publishPostNow(ctx, post.id, publisher),
      /cannot be published/,
    );
  } finally {
    db.close();
  }
});
