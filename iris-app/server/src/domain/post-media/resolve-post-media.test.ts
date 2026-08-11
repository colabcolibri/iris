import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import {
  firstPostMediaUrl,
  resolvePostMedia,
} from "./resolve-post-media.ts";
import { serializePostMedia } from "./serialize-post-media.ts";

test("resolvePostMedia prefers local assets over meta preview", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "a".repeat(64),
      metaAccessToken: "meta",
      publicBaseUrl: "https://iris.example",
      publishUrlSecret: "publish-secret",
    });

    const post = ctx.posts.create({ channel: "instagram", caption: "Local" });
    ctx.assets.create({
      postId: post.id,
      storagePath: "01.jpg",
      mime: "image/jpeg",
      sortOrder: 1,
    });

    let metaCalled = false;
    const media = await resolvePostMedia(post.id, {
      posts: ctx.posts,
      assets: ctx.assets,
      metaCommentReader: {
        async fetchMediaPreview() {
          metaCalled = true;
          return { permalink: null, mediaType: "IMAGE", slides: [] };
        },
      } as never,
      publicBaseUrl: ctx.publicBaseUrl,
      publishUrlSecret: ctx.publishUrlSecret,
    });

    assert.equal(metaCalled, false);
    assert.equal(media.source, "local");
    assert.equal(media.slides.length, 1);
    assert.match(media.slides[0]?.url ?? "", /01\.jpg/);
  } finally {
    db.close();
  }
});

test("resolvePostMedia falls back to meta slides when post has no local assets", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "b".repeat(64),
      metaAccessToken: "meta",
    });

    const post = ctx.posts.create({ channel: "instagram", caption: "Remota" });
    ctx.posts.update(post.id, { igMediaId: "ig-media-1" });

    const media = await resolvePostMedia(post.id, {
      posts: ctx.posts,
      assets: ctx.assets,
      metaCommentReader: {
        async fetchMediaPreview(igMediaId) {
          assert.equal(igMediaId, "ig-media-1");
          return {
            permalink: "https://www.instagram.com/p/abc/",
            mediaType: "CAROUSEL_ALBUM",
            slides: [
              {
                url: "https://cdn.example/1.jpg",
                mediaType: "IMAGE",
                thumbnailUrl: "https://cdn.example/1-thumb.jpg",
              },
              {
                url: "https://cdn.example/2.jpg",
                mediaType: "IMAGE",
                thumbnailUrl: null,
              },
            ],
          };
        },
      } as never,
    });

    assert.equal(media.source, "meta");
    assert.equal(media.slides.length, 2);
    assert.equal(media.slides[0]?.url, "https://cdn.example/1.jpg");
    assert.equal(firstPostMediaUrl(media), "https://cdn.example/1-thumb.jpg");

    const serialized = serializePostMedia(media);
    assert.equal(serialized?.source, "meta");
    assert.equal(serialized?.items[1]?.source, "meta");
    if (serialized?.items[1]?.source === "meta") {
      assert.equal(serialized.items[1].url, "https://cdn.example/2.jpg");
    }
  } finally {
    db.close();
  }
});
