import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext, type AppContext } from "../../api/app-context.ts";
import { createIrisMcpServer } from "../create-iris-mcp-server.ts";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { handleUploadAssetRoute } from "../../api/routes/upload-asset.ts";
import { resetUploadJtiRegistryForTests } from "../../domain/posts/upload-url.ts";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("iris_prepare_post_asset_upload rejects missing post", async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-asset-"));
  const db = openDatabase(":memory:");
  runMigrations(db);
  const ctx = createAppContext({
    db,
    adminToken: "admin",
    agentToken: "agent",
    mediaRoot,
    mcpConnectionCode: "mcp-test",
    publicBaseUrl: "http://127.0.0.1:9876",
    publishUrlSecret: "publish-secret",
  });

  const server = createIrisMcpServer(ctx);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const result = await client.callTool({
    name: "iris_prepare_post_asset_upload",
    arguments: {
      postId: "missing",
      filename: "x.png",
      sortOrder: 1,
    },
  });

  assert.equal(result.isError, true);
  await client.close();
  await server.close();
  db.close();
  await rm(mediaRoot, { recursive: true, force: true });
});

test("prepare + signed multipart upload ingests asset once", async () => {
  resetUploadJtiRegistryForTests();
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-asset-up-"));
  const db = openDatabase(":memory:");
  runMigrations(db);

  let ctx!: AppContext;
  const httpServer = createServer((req, res) => {
    const pathname = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
    void handleUploadAssetRoute(req, res, ctx, pathname);
  });

  try {
    await new Promise<void>((resolve) => {
      httpServer.listen(0, "127.0.0.1", () => resolve());
    });
    const address = httpServer.address();
    assert.ok(address && typeof address === "object");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    ctx = createAppContext({
      db,
      adminToken: "admin",
      agentToken: "agent",
      mediaRoot,
      mcpConnectionCode: "mcp-test",
      publicBaseUrl: baseUrl,
      publishUrlSecret: "publish-secret",
    });

    const post = ctx.posts.create({ caption: "img", channel: "instagram" });
    const mcp = createIrisMcpServer(ctx);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test", version: "1.0.0" });
    await mcp.connect(serverTransport);
    await client.connect(clientTransport);

    try {
      const prepare = await client.callTool({
        name: "iris_prepare_post_asset_upload",
        arguments: {
          postId: post.id,
          filename: "pixel.png",
          sortOrder: 1,
        },
      });
      assert.ok(!prepare.isError);

      const text =
        Array.isArray(prepare.content) && prepare.content[0]?.type === "text"
          ? prepare.content[0].text
          : "";
      const payload = JSON.parse(text) as {
        upload_url: string;
        curl_command: string;
      };
      assert.match(payload.upload_url, /\/upload\/assets\//);
      assert.match(payload.curl_command, /LOCAL_IMAGE_PATH/);

      await writeFile(join(mediaRoot, "pixel.png"), TINY_PNG);

      const boundary = "----irisboundary";
      const body = Buffer.concat([
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="pixel.png"\r\nContent-Type: image/png\r\n\r\n`,
        ),
        TINY_PNG,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);

      const first = await fetch(payload.upload_url, {
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });
      assert.equal(first.status, 201);
      const asset = (await first.json()) as { sort_order: number; mime: string };
      assert.equal(asset.sort_order, 1);
      assert.equal(asset.mime, "image/jpeg");

      const second = await fetch(payload.upload_url, {
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });
      assert.equal(second.status, 403);
    } finally {
      await client.close();
      await mcp.close();
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => (error ? reject(error) : resolve()));
    });
    db.close();
    await rm(mediaRoot, { recursive: true, force: true });
  }
});
