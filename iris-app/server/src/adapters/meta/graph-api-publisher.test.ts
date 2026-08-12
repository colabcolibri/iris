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
  const calls: { method: string; path: string; body: Record<string, string> }[] =
    [];

  try {
    runMigrations(db);

    const metaTokenStore = createSqliteMetaTokenStore(db, {
      encryptionKey: TEST_KEY,
    });
    metaTokenStore.upsertToken("meta-access-token");

    const assets = createSqliteAssetRepository(db);
    const posts = createSqlitePostRepository(db);
    const post = posts.create({
      channel: "instagram",
      caption: "carousel",
      collaborators: ["partner_one", "partner_two"],
    });
    const postId = post.id;

    assets.create({
      postId,
      sortOrder: 1,
      storagePath: `${postId}/01.jpg`,
      mime: "image/jpeg",
      altText: "First slide product",
      userTags: [{ username: "alice", x: 0.2, y: 0.8 }],
    });
    assets.create({
      postId,
      sortOrder: 2,
      storagePath: `${postId}/02.jpg`,
      mime: "image/jpeg",
      altText: "Second slide detail",
      userTags: [{ username: "bob", x: 0.5, y: 0.5 }],
    });

    let mediaCounter = 0;
    const pollsByContainer = new Map<string, number>();

    const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(typeof input === "string" ? input : input.toString());
      const path = url.pathname.replace("/v21.0", "");
      const method = (init?.method ?? "GET").toUpperCase();
      const body = Object.fromEntries(url.searchParams.entries());
      delete body.access_token;
      calls.push({ method, path, body });

      if (method === "GET" && url.searchParams.get("fields")?.includes("status_code")) {
        const containerId = path.replace(/^\//, "");
        const n = (pollsByContainer.get(containerId) ?? 0) + 1;
        pollsByContainer.set(containerId, n);
        // First poll IN_PROGRESS, then FINISHED — proves we wait
        const status_code = n === 1 ? "IN_PROGRESS" : "FINISHED";
        return new Response(JSON.stringify({ id: containerId, status_code }), {
          status: 200,
        });
      }

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
      posts,
      assets,
      config: {
        resolveIgUserId: () => "123456789",
        publicBaseUrl: "https://iris.example.com",
        publishUrlSecret: "publish-secret",
        fetchImpl: fetchImpl as typeof fetch,
        containerPollIntervalMs: 1,
      },
    });

    const result = await publisher.publish(postId);
    assert.equal(result.igMediaId, "ig-media-999");
    assert.equal(
      calls.filter((c) => c.body.is_carousel_item === "true").length,
      2,
    );
    const carouselCall = calls.find((c) => c.body.media_type === "CAROUSEL");
    assert.ok(carouselCall);
    assert.equal(carouselCall.body.caption, "carousel");
    assert.equal(
      carouselCall.body.collaborators,
      JSON.stringify(["partner_one", "partner_two"]),
    );
    assert.ok(
      !calls.some(
        (c) => c.body.is_carousel_item === "true" && c.body.caption,
      ),
    );
    assert.ok(
      !calls.some(
        (c) => c.body.is_carousel_item === "true" && c.body.collaborators,
      ),
    );
    const childCalls = calls.filter((c) => c.body.is_carousel_item === "true");
    assert.equal(childCalls[0]?.body.alt_text, "First slide product");
    assert.equal(
      childCalls[0]?.body.user_tags,
      JSON.stringify([{ username: "alice", x: 0.2, y: 0.8 }]),
    );
    assert.equal(childCalls[1]?.body.alt_text, "Second slide detail");
    assert.equal(
      childCalls[1]?.body.user_tags,
      JSON.stringify([{ username: "bob", x: 0.5, y: 0.5 }]),
    );
    assert.ok(calls.some((c) => c.body.creation_id === "carousel-container"));
    assert.ok(
      calls.filter((c) => c.method === "GET" && c.body.fields?.includes("status_code"))
        .length >= 3,
    );
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

    const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(typeof input === "string" ? input : input.toString());
      const path = url.pathname.replace("/v21.0", "");
      const method = (init?.method ?? "GET").toUpperCase();
      const body = Object.fromEntries(url.searchParams.entries());
      delete body.access_token;
      calls.push({ path, body });

      if (method === "GET" && url.searchParams.get("fields")?.includes("status_code")) {
        return new Response(
          JSON.stringify({ id: "single-container", status_code: "FINISHED" }),
          { status: 200 },
        );
      }

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
      posts,
      assets,
      config: {
        resolveIgUserId: () => "123456789",
        publicBaseUrl: "https://iris.example.com",
        publishUrlSecret: "publish-secret",
        fetchImpl: fetchImpl as typeof fetch,
        containerPollIntervalMs: 1,
      },
    });

    const result = await publisher.publish(postId);
    assert.equal(result.igMediaId, "ig-media-single");
    assert.equal(calls.filter((c) => c.path.endsWith("/media")).length, 1);
    const mediaCall = calls.find((c) => c.path.endsWith("/media") && !c.body.media_type);
    assert.equal(mediaCall?.body.caption, "single");
    assert.ok(calls.some((c) => c.body.creation_id === "single-container"));
  } finally {
    db.close();
  }
});

test("graph api publisher fails when container status is ERROR", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const metaTokenStore = createSqliteMetaTokenStore(db, {
      encryptionKey: TEST_KEY,
    });
    metaTokenStore.upsertToken("meta-access-token");
    const assets = createSqliteAssetRepository(db);
    const posts = createSqlitePostRepository(db);
    const post = posts.create({ channel: "instagram", caption: "bad" });
    assets.create({
      postId: post.id,
      sortOrder: 1,
      storagePath: `${post.id}/01.jpg`,
      mime: "image/jpeg",
    });

    const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(typeof input === "string" ? input : input.toString());
      const path = url.pathname.replace("/v21.0", "");
      const method = (init?.method ?? "GET").toUpperCase();
      const body = Object.fromEntries(url.searchParams.entries());

      if (method === "GET" && url.searchParams.get("fields")?.includes("status_code")) {
        return new Response(
          JSON.stringify({
            id: "broken",
            status_code: "ERROR",
            status: "download failed",
          }),
          { status: 200 },
        );
      }

      if (path.endsWith("/media")) {
        return new Response(JSON.stringify({ id: "broken" }), { status: 200 });
      }

      return new Response(JSON.stringify({ error: { message: "unexpected" } }), {
        status: 400,
      });
    };

    const publisher = createGraphApiPublisher({
      metaTokenStore,
      posts,
      assets,
      config: {
        resolveIgUserId: () => "123456789",
        publicBaseUrl: "https://iris.example.com",
        publishUrlSecret: "publish-secret",
        fetchImpl: fetchImpl as typeof fetch,
        containerPollIntervalMs: 1,
      },
    });

    await assert.rejects(
      () => publisher.publish(post.id),
      /container broken failed \(ERROR\)/,
    );
  } finally {
    db.close();
  }
});
