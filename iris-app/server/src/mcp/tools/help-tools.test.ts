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

function parseToolJson(result: CallToolResult): Record<string, unknown> {
  const text =
    Array.isArray(result.content) && result.content[0]?.type === "text"
      ? result.content[0].text
      : "{}";
  return JSON.parse(text) as Record<string, unknown>;
}

test("iris_help is listed and returns publish guide", async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-help-"));
  const db = openDatabase(":memory:");
  runMigrations(db);

  const ctx = createAppContext({
    db,
    adminToken: "admin",
    mediaRoot,
    mcpConnectionCode: "mcp-test",
  });

  const server = createIrisMcpServer(ctx);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1.0.0" });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  try {
    const tools = await client.listTools();
    assert.ok(tools.tools.some((t) => t.name === "iris_help"));

    const full = await client.callTool({ name: "iris_help", arguments: {} });
    assert.notEqual(full.isError, true);
    const fullJson = parseToolJson(full);
    assert.ok(String(fullJson.markdown).includes("agent_active_days"));

    const topic = await client.callTool({
      name: "iris_help",
      arguments: { topic: "publish" },
    });
    assert.notEqual(topic.isError, true);
    const topicJson = parseToolJson(topic);
    assert.equal(topicJson.topic, "publish");
    assert.ok(String(topicJson.markdown).includes("curl_command"));
  } finally {
    await client.close();
    await server.close();
    db.close();
    await rm(mediaRoot, { recursive: true, force: true });
  }
});
