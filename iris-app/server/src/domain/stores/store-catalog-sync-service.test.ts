import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteProductRepository } from "../../adapters/sqlite/product-repository.ts";
import { createSqliteStoreConnectionRepository } from "../../adapters/sqlite/store-connection-repository.ts";
import { createSqliteProductStoreLinkRepository } from "../../adapters/sqlite/product-store-link-repository.ts";
import { createStoreProviderRegistry } from "./store-provider-registry.ts";
import { createStoreCatalogSyncService } from "./store-catalog-sync-service.ts";
import type { StoreProvider } from "../../ports/store-provider.ts";

const TEST_KEY = "b".repeat(64);

function stubProvider(items: Array<{ externalId: string; name: string }>): StoreProvider {
  return {
    providerType: "yampi",
    async testConnection() {
      return { ok: true, message: "ok" };
    },
    async listExternalProducts() {
      return {
        items: items.map((item) => ({
          externalId: item.externalId,
          name: item.name,
          shortDescription: "resumo",
          longDescription: "longo",
          price: "R$ 10,00",
          url: null,
          imageUrl: null,
          sku: null,
          raw: {},
        })),
        page: 1,
        perPage: 50,
        hasMore: false,
      };
    },
    async getExternalProduct(_credentials, externalProductId) {
      const item = items.find((entry) => entry.externalId === externalProductId);
      if (!item) {
        return null;
      }
      return {
        externalId: item.externalId,
        name: item.name,
        shortDescription: "resumo",
        longDescription: "longo",
        price: "R$ 10,00",
        url: null,
        imageUrl: null,
        sku: null,
        raw: {},
      };
    },
  };
}

test("store catalog sync imports new products when importNew=true", async () => {
  const db = new DatabaseSync(":memory:");
  runMigrations(db);

  const products = createSqliteProductRepository(db);
  const storeConnections = createSqliteStoreConnectionRepository(db, {
    encryptionKey: TEST_KEY,
  });
  const productStoreLinks = createSqliteProductStoreLinkRepository(db);
  const registry = createStoreProviderRegistry([
    stubProvider([{ externalId: "ext-1", name: "Produto Yampi" }]),
  ]);

  const connection = storeConnections.create({
    providerType: "yampi",
    label: "Loja",
    credentials: {
      providerType: "yampi",
      yampi: { alias: "demo", userToken: "t", userSecretKey: "s" },
    },
  });

  const sync = createStoreCatalogSyncService({
    storeConnections,
    productStoreLinks,
    products,
    storeProviders: registry,
  });

  const result = await sync.syncStoreConnection(connection.id, { importNew: true });
  assert.equal(result.imported, 1);
  assert.equal(products.list(false).length, 1);
  assert.equal(productStoreLinks.listByStoreConnection(connection.id).length, 1);
});
