import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { runMigrations } from "./migrate.ts";
import { createSqliteStoreConnectionRepository } from "./store-connection-repository.ts";
import { createSqliteProductStoreLinkRepository } from "./product-store-link-repository.ts";
import { createSqliteProductFieldPolicyRepository } from "./product-field-policy-repository.ts";
import { createSqliteProductRepository } from "./product-repository.ts";

const TEST_KEY = "a".repeat(64);

test("store connection repository encrypts credentials at rest", () => {
  const db = new DatabaseSync(":memory:");
  runMigrations(db);

  const stores = createSqliteStoreConnectionRepository(db, { encryptionKey: TEST_KEY });
  const created = stores.create({
    providerType: "yampi",
    label: "Minha Yampi",
    credentials: {
      providerType: "yampi",
      yampi: {
        alias: "demo",
        userToken: "token-secret",
        userSecretKey: "secret-key",
      },
    },
  });

  const row = db
    .prepare("SELECT encrypted_credentials FROM store_connections WHERE id = ?")
    .get(created.id) as { encrypted_credentials: string };

  assert.ok(row.encrypted_credentials);
  assert.doesNotMatch(row.encrypted_credentials, /token-secret/);

  const decrypted = stores.getCredentials(created.id);
  assert.equal(decrypted?.yampi.userToken, "token-secret");
});

test("product store link and field policy repositories round-trip", () => {
  const db = new DatabaseSync(":memory:");
  runMigrations(db);

  const products = createSqliteProductRepository(db);
  const product = products.create({ slug: "prod-a", name: "Produto A" });

  const stores = createSqliteStoreConnectionRepository(db, { encryptionKey: TEST_KEY });
  const connection = stores.create({
    providerType: "yampi",
    label: "Loja",
    credentials: {
      providerType: "yampi",
      yampi: { alias: "x", userToken: "t", userSecretKey: "s" },
    },
  });

  const links = createSqliteProductStoreLinkRepository(db);
  const link = links.upsert({
    productId: product.id,
    storeConnectionId: connection.id,
    externalProductId: "ext-1",
    externalSku: "SKU",
    snapshot: {
      externalId: "ext-1",
      name: "Nome loja",
      shortDescription: "",
      longDescription: "",
      price: "R$ 10",
      url: null,
      imageUrl: null,
      sku: "SKU",
      raw: {},
    },
  });

  assert.equal(links.listByProduct(product.id).length, 1);
  assert.equal(link.snapshot.price, "R$ 10");

  const policies = createSqliteProductFieldPolicyRepository(db);
  const policy = policies.upsert({
    scope: "global",
    storeConnectionId: connection.id,
    fieldKey: "price",
    source: "store",
  });

  assert.equal(policies.listGlobal(connection.id)[0]?.id, policy.id);
});
