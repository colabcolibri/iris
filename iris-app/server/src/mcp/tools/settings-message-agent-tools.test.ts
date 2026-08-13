import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import { createIrisMcpServer } from "../create-iris-mcp-server.ts";

function parseToolJson(result: { content?: unknown; isError?: boolean }) {
  assert.notEqual(result.isError, true, JSON.stringify(result.content));
  const block = result.content?.[0];
  assert.ok(block && typeof block === "object" && "text" in block);
  return JSON.parse(String(block.text)) as Record<string, unknown>;
}

test("MCP message agent content tools read and update", async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-msg-content-"));
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

  try {
    const read = parseToolJson(
      await client.callTool({ name: "iris_get_message_agent_content", arguments: {} }),
    );
    assert.equal(typeof read.dm_soul, "string");

    const updated = parseToolJson(
      await client.callTool({
        name: "iris_update_message_agent_content",
        arguments: { dm_soul: "Tom acolhedor em DM" },
      }),
    );
    assert.equal(updated.dm_soul, "Tom acolhedor em DM");
  } finally {
    await client.close();
    await server.close();
    db.close();
    await rm(mediaRoot, { recursive: true, force: true });
  }
});
