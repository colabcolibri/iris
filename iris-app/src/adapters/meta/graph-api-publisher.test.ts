import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../sqlite/connection.ts";
import { runMigrations } from "../sqlite/migrate.ts";
import { createSqlitePostRepository } from "../sqlite/post-repository.ts";
import { createSqliteAssetRepository } from "../sqlite/asset-repository.ts";
import { createSqliteMetaTokenStore } from "../sqlite/meta-token-repository.ts";
import { createGraphApiPublisher } from "./graph-api-publisher.ts";

const TEST_KEY = "b".repeat(64);

test("graph api publisher uploads carousel and publishes", async () => {
  const db = openDatabase(":memory:");
  const calls: { path: string; body: Record<string, string> }[] = [];

  try {
    runMigrations(db);

    const metaTokenStore = createSqliteMetaTokenStore(db, {
      encryptionKey: TEST_KEY,
    });
    metaTokenStore.upsertToken("meta-access-token");

    const assets = createSqliteAssetRepository(db);
    const posts = createSqlitePostRepository(db);
    const post = posts.create({ channel: "instagram", caption: "carousel" });
    const postId = post.id;

    assets.create({
      postId,
      sortOrder: 1,
      storagePath: `${postId}/01.jpg`,
      mime: "image/jpeg",
    });
    assets.create({
      postId,
      sortOrder: 2,
      storagePath: `${postId}/02.jpg`,
      mime: "image/jpeg",
    });

    let mediaCounter = 0;

    const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(typeof input === "string" ? input : input.toString());
      const path = url.pathname.replace("/v21.0", "");
      const body = Object.fromEntries(url.searchParams.entries());
      delete body.access_token;
      calls.push({ path, body });

      if (path.endsWith("/media") && body.is_carousel_item === "true") {
        mediaCounter += 1;
        return new Response(JSON.stringify({ id: `child-${mediaCounter}` }), {
          status: 200,
        });
      }

      if (path.endsWith("/media") && body.media_type === "CAROUSEL") {
        return new Response(JSON.stringify({ id: "carousel-container" }), {
          status: 200,
        });
      }

      if (path.endsWith("/media_publish")) {
        return new Response(JSON.stringify({ id: "ig-media-999" }), {
          status: 200,
        });
      }

      return new Response(JSON.stringify({ error: { message: "unexpected" } }), {
        status: 400,
      });
    };

    const publisher = createGraphApiPublisher({
      metaTokenStore,
      assets,
      config: {
        resolveIgUserId: () => "123456789",
        publicBaseUrl: "https://iris.example.com",
        publishUrlSecret: "publish-secret",
        fetchImpl: fetchImpl as typeof fetch,
      },
    });

    const result = await publisher.publish(postId);
    assert.equal(result.igMediaId, "ig-media-999");
    assert.equal(calls.filter((c) => c.body.is_carousel_item === "true").length, 2);
    assert.ok(calls.some((c) => c.body.media_type === "CAROUSEL"));
    assert.ok(calls.some((c) => c.body.creation_id === "carousel-container"));
  } finally {
    db.close();
  }
});

test("graph api publisher publishes single image without carousel", async () => {
  const db = openDatabase(":memory:");
  const calls: { path: string; body: Record<string, string> }[] = [];

  try {
    runMigrations(db);

    const metaTokenStore = createSqliteMetaTokenStore(db, {
      encryptionKey: TEST_KEY,
    });
    metaTokenStore.upsertToken("meta-access-token");

    const assets = createSqliteAssetRepository(db);
    const posts = createSqlitePostRepository(db);
    const post = posts.create({ channel: "instagram", caption: "single" });
    const postId = post.id;

    assets.create({
      postId,
      sortOrder: 1,
      storagePath: `${postId}/01.jpg`,
      mime: "image/jpeg",
    });

    const fetchImpl = async (input: string | URL | Request) => {
      const url = new URL(typeof input === "string" ? input : input.toString());
      const path = url.pathname.replace("/v21.0", "");
      const body = Object.fromEntries(url.searchParams.entries());
      delete body.access_token;
      calls.push({ path, body });

      if (path.endsWith("/media") && !body.media_type) {
        return new Response(JSON.stringify({ id: "single-container" }), {
          status: 200,
        });
      }

      if (path.endsWith("/media_publish")) {
        return new Response(JSON.stringify({ id: "ig-media-single" }), {
          status: 200,
        });
      }

      return new Response(JSON.stringify({ error: { message: "unexpected" } }), {
        status: 400,
      });
    };

    const publisher = createGraphApiPublisher({
      metaTokenStore,
      assets,
      config: {
        resolveIgUserId: () => "123456789",
        publicBaseUrl: "https://iris.example.com",
        publishUrlSecret: "publish-secret",
        fetchImpl: fetchImpl as typeof fetch,
      },
    });

    const result = await publisher.publish(postId);
    assert.equal(result.igMediaId, "ig-media-single");
    assert.equal(calls.filter((c) => c.path.endsWith("/media")).length, 1);
    assert.ok(calls.some((c) => c.body.creation_id === "single-container"));
  } finally {
    db.close();
  }
});
