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

test("MCP product tools create, list, update and delete", async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-products-"));
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
    const createdPayload = parseToolJson(
      await client.callTool({
        name: "iris_create_product",
        arguments: {
          slug: "plano-premium",
          name: "Plano premium",
          short_description: "Acesso completo",
        },
      }),
    );
    const created = createdPayload.product as Record<string, unknown>;
    assert.equal(created.slug, "plano-premium");
    assert.equal(created.active, true);

    const listPayload = parseToolJson(
      await client.callTool({ name: "iris_list_products", arguments: {} }),
    );
    const products = listPayload.products as Array<Record<string, unknown>>;
    assert.equal(products.length, 1);

    const getPayload = parseToolJson(
      await client.callTool({
        name: "iris_get_product",
        arguments: { product_id: String(created.id) },
      }),
    );
    assert.equal((getPayload.product as Record<string, unknown>).name, "Plano premium");

    const updatedPayload = parseToolJson(
      await client.callTool({
        name: "iris_update_product",
        arguments: {
          product_id: String(created.id),
          name: "Plano premium plus",
          active: false,
        },
      }),
    );
    assert.equal((updatedPayload.product as Record<string, unknown>).name, "Plano premium plus");
    assert.equal((updatedPayload.product as Record<string, unknown>).active, false);

    const activeOnly = parseToolJson(
      await client.callTool({
        name: "iris_list_products",
        arguments: { active_only: true },
      }),
    );
    assert.equal((activeOnly.products as unknown[]).length, 0);

    const deleted = parseToolJson(
      await client.callTool({
        name: "iris_delete_product",
        arguments: { product_id: String(created.id) },
      }),
    );
    assert.equal(deleted.ok, true);

    const empty = parseToolJson(
      await client.callTool({ name: "iris_list_products", arguments: {} }),
    );
    assert.equal((empty.products as unknown[]).length, 0);
  } finally {
    await client.close();
    await server.close();
    db.close();
    await rm(mediaRoot, { recursive: true, force: true });
  }
});
