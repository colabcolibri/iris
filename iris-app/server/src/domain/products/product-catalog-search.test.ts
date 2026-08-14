import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteProductRepository } from "../../adapters/sqlite/product-repository.ts";
import { createSqliteProductStoreLinkRepository } from "../../adapters/sqlite/product-store-link-repository.ts";
import { createSqliteProductFieldPolicyRepository } from "../../adapters/sqlite/product-field-policy-repository.ts";
import { searchProductCatalog } from "./product-catalog-search.ts";

test("searchProductCatalog matches partial tokens and ranks by relevance", () => {
  const db = new DatabaseSync(":memory:");
  runMigrations(db);
  const products = createSqliteProductRepository(db);
  products.create({
    slug: "jogo-grok",
    name: "Jogo Grok",
    shortDescription: "Jogo de tabuleiro",
    active: true,
  });
  products.create({
    slug: "imagine-me",
    name: "Imagine-me",
    shortDescription: "Livro ilustrado",
    active: true,
  });

  const deps = {
    products,
    productStoreLinks: createSqliteProductStoreLinkRepository(db),
    productFieldPolicies: createSqliteProductFieldPolicyRepository(db),
  };

  const grok = searchProductCatalog(deps, "grok");
  assert.equal(grok.items.length, 1);
  assert.equal(grok.items[0]?.slug, "jogo-grok");

  const empty = searchProductCatalog(deps, "bolsa nomade");
  assert.equal(empty.items.length, 0);
  assert.ok(empty.suggestions.length > 0);
});
