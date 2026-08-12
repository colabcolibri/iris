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

function parseToolJson(result: Awaited<ReturnType<Client["callTool"]>>): Record<string, unknown> {
  assert.notEqual(result.isError, true, JSON.stringify(result.content));
  const block = result.content?.[0];
  assert.ok(block && "text" in block);
  return JSON.parse(block.text) as Record<string, unknown>;
}

function toolErrorText(result: Awaited<ReturnType<Client["callTool"]>>): string {
  assert.equal(result.isError, true);
  const block = result.content?.[0];
  assert.ok(block && "text" in block);
  return block.text;
}

async function withMcpClient(
  run: (client: Client) => Promise<void>,
): Promise<void> {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-persona-tools-"));
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
    await run(client);
  } finally {
    await client.close();
    await server.close();
    db.close();
    await rm(mediaRoot, { recursive: true, force: true });
  }
}

test("MCP persona tools return defaults and register", async () => {
  await withMcpClient(async (client) => {
    const tools = await client.listTools();
    const toolNames = tools.tools.map((tool) => tool.name);
    assert.ok(toolNames.includes("iris_get_reply_persona"));
    assert.ok(toolNames.includes("iris_update_reply_persona"));
    assert.ok(toolNames.includes("iris_get_agent_content"));
    assert.ok(toolNames.includes("iris_update_agent_content"));

    const persona = parseToolJson(
      await client.callTool({ name: "iris_get_reply_persona", arguments: {} }),
    );
    assert.equal(persona.response_language, "pt-BR");
    assert.equal(persona.max_chars, 500);
    assert.equal(persona.updated_at, null);

    const content = parseToolJson(
      await client.callTool({ name: "iris_get_agent_content", arguments: {} }),
    );
    assert.ok(typeof content.soul === "string" && (content.soul as string).length > 0);
    assert.ok(typeof content.restrictions === "string" && (content.restrictions as string).length > 0);
    assert.equal(content.updated_at, null);
  });
});

test("MCP persona partial update persists response_language", async () => {
  await withMcpClient(async (client) => {
    const updated = parseToolJson(
      await client.callTool({
        name: "iris_update_reply_persona",
        arguments: { response_language: "en-US" },
      }),
    );
    assert.equal(updated.response_language, "en-US");
    assert.equal(updated.max_chars, 500);

    const stored = parseToolJson(
      await client.callTool({ name: "iris_get_reply_persona", arguments: {} }),
    );
    assert.equal(stored.response_language, "en-US");
    assert.ok(stored.updated_at);
  });
});

test("MCP persona update rejects max_chars outside 100-1000", async () => {
  await withMcpClient(async (client) => {
    const result = await client.callTool({
      name: "iris_update_reply_persona",
      arguments: { max_chars: 50 },
    });
    assert.equal(result.isError, true);
    assert.match(toolErrorText(result), /max_chars/);

    const unchanged = parseToolJson(
      await client.callTool({ name: "iris_get_reply_persona", arguments: {} }),
    );
    assert.equal(unchanged.max_chars, 500);
  });
});

test("MCP agent content update persists restrictions", async () => {
  await withMcpClient(async (client) => {
    const current = parseToolJson(
      await client.callTool({ name: "iris_get_agent_content", arguments: {} }),
    );

    const updated = parseToolJson(
      await client.callTool({
        name: "iris_update_agent_content",
        arguments: {
          soul: current.soul,
          page: current.page,
          knowledge: current.knowledge,
          restrictions: "Não prometer desconto via MCP",
        },
      }),
    );
    assert.equal(updated.restrictions, "Não prometer desconto via MCP");

    const stored = parseToolJson(
      await client.callTool({ name: "iris_get_agent_content", arguments: {} }),
    );
    assert.equal(stored.restrictions, "Não prometer desconto via MCP");
    assert.ok(stored.updated_at);
  });
});

test("MCP agent content update rejects oversized block", async () => {
  await withMcpClient(async (client) => {
    const current = parseToolJson(
      await client.callTool({ name: "iris_get_agent_content", arguments: {} }),
    );
    const oversized = "x".repeat(32_001);

    const result = await client.callTool({
      name: "iris_update_agent_content",
      arguments: {
        soul: current.soul,
        page: current.page,
        knowledge: current.knowledge,
        restrictions: oversized,
      },
    });
    assert.equal(result.isError, true);
    assert.match(toolErrorText(result), /restrictions exceeds/);
  });
});
