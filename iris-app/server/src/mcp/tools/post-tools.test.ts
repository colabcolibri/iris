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
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

function parseToolJson(result: CallToolResult): unknown {
  const text =
    Array.isArray(result.content) && result.content[0]?.type === "text"
      ? result.content[0].text
      : "{}";
  return JSON.parse(text);
}

async function createMcpClient(ctx: ReturnType<typeof createAppContext>) {
  const server = createIrisMcpServer(ctx);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    client,
    async close() {
      await client.close();
      await server.close();
    },
  };
}

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

test("MCP post tools get/update reply_prompt and silence flags", async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-reply-briefing-"));
  const db = openDatabase(":memory:");
  runMigrations(db);

  const ctx = createAppContext({
    db,
    adminToken: "admin",
    agentToken: "agent",
    mediaRoot,
    mcpConnectionCode: "mcp-test",
  });

  const { client, close } = await createMcpClient(ctx);

  try {
    const createResult = await client.callTool({
      name: "iris_create_post",
      arguments: { caption: "Briefing test", status: "draft" },
    });
    assert.notEqual(createResult.isError, true);
    const created = parseToolJson(createResult) as { id: string };
    const postId = created.id;

    const getDefaults = await client.callTool({
      name: "iris_get_post",
      arguments: { postId },
    });
    assert.notEqual(getDefaults.isError, true);
    const defaultPost = (parseToolJson(getDefaults) as { post: Record<string, unknown> })
      .post;
    assert.equal(defaultPost.reply_prompt, null);
    assert.equal(defaultPost.silence_soul, false);
    assert.equal(defaultPost.silence_page, false);
    assert.equal(defaultPost.silence_knowledge, false);
    assert.equal(defaultPost.silence_restrictions, false);

    const updateResult = await client.callTool({
      name: "iris_update_post",
      arguments: {
        postId,
        replyPrompt: "Responda com tom acolhedor e cite o produto azul.",
        silencePage: true,
        silenceKnowledge: true,
        carouselSummary: "Produto azul no fundo branco.",
      },
    });
    assert.notEqual(updateResult.isError, true);
    const updated = parseToolJson(updateResult) as Record<string, unknown>;
    assert.equal(updated.reply_prompt, "Responda com tom acolhedor e cite o produto azul.");
    assert.equal(updated.silence_page, true);
    assert.equal(updated.silence_knowledge, true);
    assert.equal(updated.carousel_summary, "Produto azul no fundo branco.");

    const stored = ctx.posts.findById(postId);
    assert.equal(stored?.replyPrompt, "Responda com tom acolhedor e cite o produto azul.");
    assert.equal(stored?.silencePage, true);
    assert.equal(stored?.silenceKnowledge, true);
    assert.equal(stored?.carouselSummary, "Produto azul no fundo branco.");

    const getUpdated = await client.callTool({
      name: "iris_get_post",
      arguments: { postId },
    });
    assert.notEqual(getUpdated.isError, true);
    const post = (parseToolJson(getUpdated) as { post: Record<string, unknown> }).post;
    assert.equal(post.reply_prompt, "Responda com tom acolhedor e cite o produto azul.");
    assert.equal(post.silence_page, true);
    assert.equal(post.silence_knowledge, true);
    assert.equal(post.carousel_summary, "Produto azul no fundo branco.");
  } finally {
    await close();
    db.close();
    await rm(mediaRoot, { recursive: true, force: true });
  }
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

  const { ingestPostAsset } = await import("../../domain/posts/asset-ingest.ts");
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
