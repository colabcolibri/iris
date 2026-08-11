import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import { createIrisMcpServer } from "../create-iris-mcp-server.ts";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

test("MCP post tools create and list posts", async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-post-tools-"));
  const db = openDatabase(":memory:");
  runMigrations(db);

  const ctx = createAppContext({
    db,
    adminToken: "admin",
    agentToken: "agent",
    mediaRoot,
    mcpConnectionCode: "mcp-test",
  });

  const server = createIrisMcpServer(ctx);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1.0.0" });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const tools = await client.listTools();
  const toolNames = tools.tools.map((tool) => tool.name);
  assert.ok(toolNames.includes("iris_create_post"));
  assert.ok(toolNames.includes("iris_list_posts"));

  const createResult = await client.callTool({
    name: "iris_create_post",
    arguments: { caption: "MCP draft", status: "draft" },
  });
  assert.notEqual(createResult.isError, true, JSON.stringify(createResult.content));

  const listResult = await client.callTool({
    name: "iris_list_posts",
    arguments: {},
  });
  assert.notEqual(listResult.isError, true);
  const listText = createResult.content?.[0];
  assert.ok(listText && "text" in listText);

  await client.close();
  await server.close();
  db.close();
  await rm(mediaRoot, { recursive: true, force: true });
});

test("ingestPostAsset stores optimized image", async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-asset-ingest-"));
  const db = openDatabase(":memory:");
  runMigrations(db);
  const ctx = createAppContext({
    db,
    adminToken: "admin",
    agentToken: "agent",
    mediaRoot,
    mcpConnectionCode: "mcp-test",
  });

  const post = ctx.posts.create({ caption: "img test", channel: "instagram" });
  const tinyPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );

  const { ingestPostAsset } = await import("../../domain/asset-ingest.ts");
  const asset = await ingestPostAsset(
    {
      posts: ctx.posts,
      assets: ctx.assets,
      mediaStorage: ctx.mediaStorage,
      imageOptimizer: ctx.imageOptimizer,
    },
    {
      postId: post.id,
      buffer: tinyPng,
      filename: "pixel.png",
      sortOrder: 1,
    },
  );

  assert.equal(asset.postId, post.id);
  assert.equal(asset.sortOrder, 1);

  db.close();
  await rm(mediaRoot, { recursive: true, force: true });
});
