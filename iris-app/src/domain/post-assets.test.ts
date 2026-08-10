import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../adapters/sqlite/connection.ts";
import { runMigrations } from "../adapters/sqlite/migrate.ts";
import { createSqlitePostRepository } from "../adapters/sqlite/post-repository.ts";
import { createSqliteAssetRepository } from "../adapters/sqlite/asset-repository.ts";
import { createFsMediaStorage } from "../adapters/media-storage/fs-media-storage.ts";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { deletePostAsset, reorderPostAssets } from "../domain/post-assets.ts";

test("deletePostAsset removes db row and file", async () => {
  const db = openDatabase(":memory:");
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-media-"));

  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const assets = createSqliteAssetRepository(db);
    const mediaStorage = createFsMediaStorage(mediaRoot);

    const post = posts.create({ channel: "instagram", caption: "x" });
    await mkdir(join(mediaRoot, post.id), { recursive: true });
    await writeFile(join(mediaRoot, post.id, "01.jpg"), "fake-image");

    const asset = assets.create({
      postId: post.id,
      sortOrder: 1,
      storagePath: `${post.id}/01.jpg`,
      mime: "image/jpeg",
    });

    await deletePostAsset(post.id, asset.id, {
      posts,
      assets,
      mediaStorage,
    });

    assert.equal(assets.listByPostId(post.id).length, 0);
    assert.equal(await mediaStorage.read(post.id, "01.jpg"), null);
  } finally {
    db.close();
  }
});

test("reorderPostAssets updates sort_order", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const posts = createSqlitePostRepository(db);
    const assets = createSqliteAssetRepository(db);
    const mediaStorage = createFsMediaStorage("/tmp/unused");

    const post = posts.create({ channel: "instagram", caption: "x" });
    const first = assets.create({
      postId: post.id,
      sortOrder: 1,
      storagePath: `${post.id}/01.jpg`,
      mime: "image/jpeg",
    });
    const second = assets.create({
      postId: post.id,
      sortOrder: 2,
      storagePath: `${post.id}/02.jpg`,
      mime: "image/jpeg",
    });

    const reordered = reorderPostAssets(post.id, [second.id, first.id], {
      posts,
      assets,
      mediaStorage,
    });

    assert.deepEqual(
      reordered.map((asset) => asset.id),
      [second.id, first.id],
    );
    assert.deepEqual(
      reordered.map((asset) => asset.sortOrder),
      [1, 2],
    );
  } finally {
    db.close();
  }
});
