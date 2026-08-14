import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteProductRepository } from "../../adapters/sqlite/product-repository.ts";
import { createSqliteProductStoreLinkRepository } from "../../adapters/sqlite/product-store-link-repository.ts";
import { createSqliteProductFieldPolicyRepository } from "../../adapters/sqlite/product-field-policy-repository.ts";
import { createDefaultHarnessToolRegistry } from "./bootstrap-harness-tools.ts";
import { createCatalogSearchProductsTool } from "./tools/catalog-search-products.ts";
import { createFinishDraftTool } from "./tools/finish-draft.ts";
import { DEFAULT_HARNESS_BUDGET } from "./types.ts";
import type { HarnessToolContext } from "../../ports/harness-tool.ts";

function createToolContext(): HarnessToolContext {
  const db = new DatabaseSync(":memory:");
  runMigrations(db);
  const products = createSqliteProductRepository(db);
  products.create({
    slug: "camiseta-preta",
    name: "Camiseta Preta",
    shortDescription: "Algodão premium",
    active: true,
  });

  return {
    products,
    productStoreLinks: createSqliteProductStoreLinkRepository(db),
    productFieldPolicies: createSqliteProductFieldPolicyRepository(db),
    storeConnections: {
      findById: () => null,
      list: () => [],
      create: () => {
        throw new Error("not implemented");
      },
      update: () => null,
      remove: () => false,
      getCredentials: () => null,
    },
    storeProviders: {
      get: () => {
        throw new Error("not implemented");
      },
    },
    budget: DEFAULT_HARNESS_BUDGET,
    refreshCount: 0,
  };
}

describe("harness tool registry", () => {
  test("registers default catalog tools", () => {
    const registry = createDefaultHarnessToolRegistry();
    assert.ok(registry.get("search_products"));
    assert.ok(registry.get("get_resolved_product"));
    assert.ok(registry.get("finish_draft"));
  });
});

describe("catalog tools", () => {
  test("search_products returns matching active products", async () => {
    const ctx = createToolContext();
    const tool = createCatalogSearchProductsTool();
    const result = await tool.execute(ctx, { query: "camiseta" });
    assert.equal(result.success, true);
    const output = result.output as { items: Array<{ slug: string }> };
    assert.equal(output.items.length, 1);
    assert.equal(output.items[0]?.slug, "camiseta-preta");
  });

  test("finish_draft rejects empty text", async () => {
    const tool = createFinishDraftTool();
    const result = await tool.execute(createToolContext(), { text: "  " });
    assert.equal(result.success, false);
    assert.equal(result.errorCode, "empty_text");
  });
});
