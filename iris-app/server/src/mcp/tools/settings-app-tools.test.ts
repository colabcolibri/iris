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

async function createMcpClient() {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-settings-app-"));
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

  return {
    client,
    server,
    db,
    mediaRoot,
    async close() {
      await client.close();
      await server.close();
      db.close();
      await rm(mediaRoot, { recursive: true, force: true });
    },
  };
}

test("MCP app settings tools read defaults", async () => {
  const harness = await createMcpClient();

  try {
    const tools = await harness.client.listTools();
    const toolNames = tools.tools.map((tool) => tool.name);
    assert.ok(toolNames.includes("iris_get_app_settings"));
    assert.ok(toolNames.includes("iris_update_app_settings"));

    const result = await harness.client.callTool({
      name: "iris_get_app_settings",
      arguments: {},
    });

    const settings = parseToolJson(result);
    assert.equal(typeof settings.timezone, "string");
    assert.equal(settings.reply_mode, "auto");
    assert.equal(typeof settings.reply_delay_seconds, "number");
    assert.equal(typeof settings.auto_reply_enabled, "boolean");
    assert.equal(typeof settings.auto_monitor_enabled, "boolean");
    assert.equal(typeof settings.auto_monitor_interval_seconds, "number");
    assert.equal("updated_at" in settings, false);
  } finally {
    await harness.close();
  }
});

test("MCP app settings tools partial update persists", async () => {
  const harness = await createMcpClient();

  try {
    const updateResult = await harness.client.callTool({
      name: "iris_update_app_settings",
      arguments: { reply_mode: "draft" },
    });
    const updated = parseToolJson(updateResult);
    assert.equal(updated.reply_mode, "draft");
    assert.equal(updated.auto_reply_enabled, true);

    const readResult = await harness.client.callTool({
      name: "iris_get_app_settings",
      arguments: {},
    });
    const persisted = parseToolJson(readResult);
    assert.equal(persisted.reply_mode, "draft");
  } finally {
    await harness.close();
  }
});

test("MCP app settings tools reject invalid monitor interval", async () => {
  const harness = await createMcpClient();

  try {
    const before = await harness.client.callTool({
      name: "iris_get_app_settings",
      arguments: {},
    });
    const beforeSettings = parseToolJson(before);

    const invalidResult = await harness.client.callTool({
      name: "iris_update_app_settings",
      arguments: { auto_monitor_interval_seconds: 10 },
    });

    assert.equal(invalidResult.isError, true);
    const errorText = invalidResult.content?.[0];
    assert.ok(errorText && "text" in errorText);
    assert.match(String(errorText.text), /60.*3600/);

    const after = await harness.client.callTool({
      name: "iris_get_app_settings",
      arguments: {},
    });
    const afterSettings = parseToolJson(after);
    assert.deepEqual(afterSettings, beforeSettings);
  } finally {
    await harness.close();
  }
});
