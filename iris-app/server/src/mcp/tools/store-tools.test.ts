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

function installYampiFetchMock(alias = "demo") {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    if (!url.includes("api.dooki.com.br")) {
      return originalFetch(input, init);
    }
    if (url.includes("/auth/me")) {
      return new Response(
        JSON.stringify({
          data: {
            merchants: {
              data: [{ alias, name: "Loja demo", active: true, domain: "demo.example" }],
            },
          },
        }),
        { status: 200 },
      );
    }
    if (url.includes("/catalog/products")) {
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

test("MCP store tools list, create and delete without leaking secrets", async () => {
  const restoreFetch = installYampiFetchMock("demo");
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-stores-"));
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
        name: "iris_create_store_connection",
        arguments: {
          label: "Loja MCP",
          alias: "demo",
          user_token: "secret-token",
          user_secret_key: "secret-key",
        },
      }),
    );
    const created = createdPayload.store_connection as Record<string, unknown>;
    assert.equal(created.label, "Loja MCP");
    assert.equal(created.has_credentials, true);
    assert.equal(created.yampi_alias, "demo");
    assert.equal(created.user_token, undefined);

    const listPayload = parseToolJson(
      await client.callTool({ name: "iris_list_store_connections", arguments: {} }),
    );
    const connections = listPayload.store_connections as Array<Record<string, unknown>>;
    assert.equal(connections.length, 1);
    assert.equal(connections[0]?.user_token, undefined);

    const deletePayload = parseToolJson(
      await client.callTool({
        name: "iris_delete_store_connection",
        arguments: { store_connection_id: String(created.id) },
      }),
    );
    assert.equal(deletePayload.ok, true);

    const emptyList = parseToolJson(
      await client.callTool({ name: "iris_list_store_connections", arguments: {} }),
    );
    assert.equal((emptyList.store_connections as unknown[]).length, 0);
  } finally {
    restoreFetch();
    await client.close();
    await server.close();
    await rm(mediaRoot, { recursive: true, force: true });
  }
});

test("MCP product field policies round-trip with inherit", async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-store-policies-"));
  const db = openDatabase(":memory:");
  runMigrations(db);
  const ctx = createAppContext({
    db,
    adminToken: "admin",
    agentToken: "agent",
    mediaRoot,
    mcpConnectionCode: "mcp-test",
  });

  const product = ctx.products.create({
    slug: "camiseta",
    name: "Camiseta Iris",
    shortDescription: "Algodão",
    longDescription: "Detalhes Iris",
    active: true,
    sortOrder: 1,
  });

  const connection = ctx.storeConnections.create({
    providerType: "yampi",
    label: "Loja",
    credentials: {
      providerType: "yampi",
      yampi: { alias: "demo", userToken: "t", userSecretKey: "s" },
    },
    settings: {},
  });

  const server = createIrisMcpServer(ctx);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  try {
    const updatePayload = parseToolJson(
      await client.callTool({
        name: "iris_update_product_field_policies",
        arguments: {
          product_id: product.id,
          store_connection_id: connection.id,
          policies: {
            price: { source: "store" },
          },
        },
      }),
    );
    const policies = updatePayload.policies as Array<Record<string, unknown>>;
    assert.equal(policies.length, 1);
    assert.equal(policies[0]?.field_key, "price");

    const getPayload = parseToolJson(
      await client.callTool({
        name: "iris_get_product_field_policies",
        arguments: {
          product_id: product.id,
          store_connection_id: connection.id,
        },
      }),
    );
    const productPolicies = getPayload.product_policies as Array<Record<string, unknown>>;
    assert.equal(productPolicies.length, 1);

    parseToolJson(
      await client.callTool({
        name: "iris_update_product_field_policies",
        arguments: {
          product_id: product.id,
          store_connection_id: connection.id,
          policies: {
            price: { source: "inherit" },
          },
        },
      }),
    );

    const afterInherit = parseToolJson(
      await client.callTool({
        name: "iris_get_product_field_policies",
        arguments: {
          product_id: product.id,
          store_connection_id: connection.id,
        },
      }),
    );
    assert.equal((afterInherit.product_policies as unknown[]).length, 0);
  } finally {
    await client.close();
    await server.close();
    await rm(mediaRoot, { recursive: true, force: true });
  }
});
