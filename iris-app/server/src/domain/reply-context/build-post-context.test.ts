import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqlitePostRepository } from "../../adapters/sqlite/post-repository.ts";
import { createSqliteAssetRepository } from "../../adapters/sqlite/asset-repository.ts";
import { buildPostReplyContext } from "./build-post-context.ts";

test("buildPostReplyContext returns ordered assets with publish urls", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const assets = createSqliteAssetRepository(db);

    const post = posts.create({
      channel: "instagram",
      caption: "Carrossel",
      status: "published",
    });

    assets.create({
      postId: post.id,
      sortOrder: 1,
      storagePath: `${post.id}/01.jpg`,
      mime: "image/jpeg",
      width: 1080,
      height: 720,
      optimizedSizeBytes: 1200,
    });
    assets.create({
      postId: post.id,
      sortOrder: 2,
      storagePath: `${post.id}/02.jpg`,
      mime: "image/jpeg",
      width: 1080,
      height: 720,
      optimizedSizeBytes: 1300,
    });

    const context = buildPostReplyContext(post.id, {
      posts,
      assets,
      publicBaseUrl: "https://iris.example.com",
      publishUrlSecret: "secret",
    });

    assert.ok(context);
    assert.equal(context!.assets.length, 2);
    assert.equal(context!.assets[0].sortOrder, 1);
    assert.match(context!.assets[0].publishUrl ?? "", /publish\/media/);
  } finally {
    db.close();
  }
});
