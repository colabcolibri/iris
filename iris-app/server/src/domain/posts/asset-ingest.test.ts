import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqlitePostRepository } from "../../adapters/sqlite/post-repository.ts";
import { createSqliteAssetRepository } from "../../adapters/sqlite/asset-repository.ts";
import { createFsMediaStorage } from "../../adapters/media-storage/fs-media-storage.ts";
import { createSharpImageOptimizer } from "../../adapters/image-optimizer/sharp-optimizer.ts";
import { ingestPostAsset } from "./asset-ingest.ts";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("ingestPostAsset replaces existing asset at the same sort_order", async () => {
  const db = openDatabase(":memory:");
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-ingest-replace-"));

  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const assets = createSqliteAssetRepository(db);
    const mediaStorage = createFsMediaStorage(mediaRoot);
    const imageOptimizer = createSharpImageOptimizer();
    const deps = { posts, assets, mediaStorage, imageOptimizer };

    const post = posts.create({ channel: "instagram", caption: "replace" });
    const first = await ingestPostAsset(deps, {
      postId: post.id,
      buffer: TINY_PNG,
      filename: "first.png",
      sortOrder: 1,
    });

    await assets.update(first.id, {
      altText: "capa",
      userTags: [{ username: "colibri", x: 0.5, y: 0.5 }],
    });

    const second = await ingestPostAsset(deps, {
      postId: post.id,
      buffer: TINY_PNG,
      filename: "second.png",
      sortOrder: 1,
    });

    const listed = assets.listByPostId(post.id);
    assert.equal(listed.length, 1);
    assert.notEqual(second.id, first.id);
    assert.equal(second.sortOrder, 1);
    assert.equal(second.originalFilename, "second.png");
    assert.equal(second.altText, "capa");
    assert.deepEqual(second.userTags, [{ username: "colibri", x: 0.5, y: 0.5 }]);

    const file = await mediaStorage.read(post.id, "01.jpg");
    assert.ok(file);
    assert.equal(file.mime, "image/jpeg");
  } finally {
    db.close();
    await import("node:fs/promises").then(({ rm }) =>
      rm(mediaRoot, { recursive: true, force: true }),
    );
  }
});

test("ingestPostAsset clears ghost db row when re-uploading missing file", async () => {
  const db = openDatabase(":memory:");
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-ingest-ghost-"));

  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const assets = createSqliteAssetRepository(db);
    const mediaStorage = createFsMediaStorage(mediaRoot);
    const imageOptimizer = createSharpImageOptimizer();
    const deps = { posts, assets, mediaStorage, imageOptimizer };

    const post = posts.create({ channel: "instagram", caption: "ghost" });
    assets.create({
      postId: post.id,
      sortOrder: 1,
      storagePath: `${post.id}/01.jpg`,
      mime: "image/jpeg",
      width: 100,
      height: 100,
    });

    const restored = await ingestPostAsset(deps, {
      postId: post.id,
      buffer: TINY_PNG,
      filename: "restored.png",
      sortOrder: 1,
    });

    assert.equal(assets.listByPostId(post.id).length, 1);
    assert.equal(restored.sortOrder, 1);
    const file = await mediaStorage.read(post.id, "01.jpg");
    assert.ok(file);
  } finally {
    db.close();
    await import("node:fs/promises").then(({ rm }) =>
      rm(mediaRoot, { recursive: true, force: true }),
    );
  }
});
