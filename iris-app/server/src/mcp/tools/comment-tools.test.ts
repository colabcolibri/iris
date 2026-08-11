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

test("iris_list_post_comments returns empty for new post", async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-comments-"));
  const db = openDatabase(":memory:");
  runMigrations(db);
  const ctx = createAppContext({
    db,
    adminToken: "admin",
    agentToken: "agent",
    mediaRoot,
    mcpConnectionCode: "mcp-test",
  });

  const post = ctx.posts.create({ caption: "c", channel: "instagram" });
  const server = createIrisMcpServer(ctx);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const result = await client.callTool({
    name: "iris_list_post_comments",
    arguments: { postId: post.id },
  });

  assert.notEqual(result.isError, true);
  await client.close();
  await server.close();
  db.close();
  await rm(mediaRoot, { recursive: true, force: true });
});
