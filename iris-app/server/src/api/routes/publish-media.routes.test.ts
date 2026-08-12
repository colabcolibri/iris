import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../app-context.ts";
import { handlePublishMediaRoute } from "./publish-media.ts";
import { buildPublishImageUrl } from "../../domain/posts/publish-url.ts";
import { ingestPostAsset } from "../../domain/posts/asset-ingest.ts";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("GET publish/media serves jpeg for valid signed url (5 path segments)", async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-publish-media-"));
  const db = openDatabase(":memory:");
  runMigrations(db);
  const secret = "publish-secret";

  const ctx = createAppContext({
    db,
    adminToken: "admin",
    agentToken: "agent",
    mediaRoot,
    publishUrlSecret: secret,
    publicBaseUrl: "http://127.0.0.1",
  });

  const post = ctx.posts.create({ caption: "pub", channel: "instagram" });
  await ingestPostAsset(
    {
      posts: ctx.posts,
      assets: ctx.assets,
      mediaStorage: ctx.mediaStorage,
      imageOptimizer: ctx.imageOptimizer,
    },
    {
      postId: post.id,
      sortOrder: 1,
      buffer: TINY_PNG,
      filename: "slide.png",
      mime: "image/png",
    },
  );

  const httpServer = createServer((req, res) => {
    const pathname = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
    handlePublishMediaRoute(req, res, ctx, pathname);
  });

  try {
    await new Promise<void>((resolve) => {
      httpServer.listen(0, "127.0.0.1", () => resolve());
    });
    const address = httpServer.address();
    assert.ok(address && typeof address === "object");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const url = buildPublishImageUrl(post.id, "01.jpg", baseUrl, secret);
    const pathOnly = new URL(url).pathname;
    assert.match(pathOnly, /^\/publish\/media\/[^/]+\/[^/]+\/01\.jpg$/);
    assert.equal(pathOnly.split("/").filter(Boolean).length, 5);

    const response = await fetch(url);
    const body = Buffer.from(await response.arrayBuffer());
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /image\/jpeg/);
    assert.ok(body.length > 0);
  } finally {
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => (error ? reject(error) : resolve()));
    });
    db.close();
    await rm(mediaRoot, { recursive: true, force: true });
  }
});
