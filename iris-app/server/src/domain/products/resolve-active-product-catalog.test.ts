import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteProductRepository } from "../../adapters/sqlite/product-repository.ts";
import { createSqliteProductStoreLinkRepository } from "../../adapters/sqlite/product-store-link-repository.ts";
import { createSqliteProductFieldPolicyRepository } from "../../adapters/sqlite/product-field-policy-repository.ts";
import { createSqliteStoreConnectionRepository } from "../../adapters/sqlite/store-connection-repository.ts";
import { resolveActiveProductCatalog } from "./resolve-active-product-catalog.ts";
import { buildMessageTriagePrompt } from "../message-harness/build-prompts.ts";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import { defaultReplyPersona } from "../settings/reply-persona-defaults.ts";

const TEST_KEY = "e".repeat(64);

test("resolveActiveProductCatalog applies store price in harness prompt", () => {
  const db = new DatabaseSync(":memory:");
  runMigrations(db);

  const products = createSqliteProductRepository(db);
  const product = products.create({
    slug: "camiseta",
    name: "Camiseta manual",
    shortDescription: "Resumo manual",
  });

  const storeConnections = createSqliteStoreConnectionRepository(db, {
    encryptionKey: TEST_KEY,
  });
  const connection = storeConnections.create({
    providerType: "yampi",
    label: "Loja",
    credentials: {
      providerType: "yampi",
      yampi: { alias: "x", userToken: "t", userSecretKey: "s" },
    },
  });

  const productStoreLinks = createSqliteProductStoreLinkRepository(db);
  productStoreLinks.upsert({
    productId: product.id,
    storeConnectionId: connection.id,
    externalProductId: "99",
    snapshot: {
      externalId: "99",
      name: "Camiseta loja",
      shortDescription: "Resumo loja",
      longDescription: "",
      price: "R$ 150,00",
      url: "https://loja.example/p/camiseta",
      imageUrl: null,
      sku: null,
      raw: {},
    },
  });

  const productFieldPolicies = createSqliteProductFieldPolicyRepository(db);
  productFieldPolicies.upsert({
    scope: "product",
    storeConnectionId: connection.id,
    productId: product.id,
    fieldKey: "price",
    source: "store",
  });
  productFieldPolicies.upsert({
    scope: "product",
    storeConnectionId: connection.id,
    productId: product.id,
    fieldKey: "long_description",
    source: "disabled",
  });

  const catalog = resolveActiveProductCatalog(
    { products, productStoreLinks, productFieldPolicies },
    true,
  );

  assert.equal(catalog[0]?.price, "R$ 150,00");

  const context: MessageReplyContext = {
    persona: defaultReplyPersona(),
    conversation: { participantUsername: "user", replyPrompt: null },
    thread: {
      entries: [{ direction: "inbound", text: "quanto custa?", authorUsername: "user" }],
    },
    products: catalog,
    brandUsername: "marca",
    targetMessage: { text: "quanto custa?", authorUsername: "user" },
  };

  const prompt = buildMessageTriagePrompt(context, "");
  assert.match(prompt, /R\$ 150,00/);
  assert.doesNotMatch(prompt, /detalhes:/i);
});
