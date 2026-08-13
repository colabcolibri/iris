import test from "node:test";
import assert from "node:assert/strict";
import {
  formatResolvedProductForPrompt,
  resolveProductFields,
} from "./product-field-resolver.ts";
import type { Product } from "./product.ts";
import type { ExternalProduct } from "../stores/store-types.ts";

const product: Product = {
  id: "p1",
  slug: "camiseta-iris",
  name: "Camiseta Iris",
  shortDescription: "Resumo manual",
  longDescription: "Detalhes manuais",
  active: true,
  sortOrder: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const snapshot: ExternalProduct = {
  externalId: "99",
  name: "Camiseta Yampi",
  shortDescription: "Resumo loja",
  longDescription: "Detalhes loja",
  price: "R$ 120,00",
  url: "https://loja.example/p/camiseta",
  imageUrl: "https://cdn.example/img.jpg",
  sku: "SKU-1",
  raw: {},
};

test("resolveProductFields defaults text to iris and commerce fields to store", () => {
  const view = resolveProductFields({
    product,
    snapshot,
    globalPolicies: [],
    productPolicies: [],
  });

  assert.equal(view.name, "Camiseta Iris");
  assert.equal(view.price, "R$ 120,00");
  assert.equal(view.fieldSources.short_description, "iris");
  assert.equal(view.fieldSources.price, "store");
});

test("resolveProductFields applies per-product override", () => {
  const view = resolveProductFields({
    product,
    snapshot,
    globalPolicies: [],
    productPolicies: [
      {
        id: "pol1",
        scope: "product",
        storeConnectionId: "sc1",
        productId: product.id,
        fieldKey: "short_description",
        source: "store",
        createdAt: "",
        updatedAt: "",
      },
    ],
  });

  assert.equal(view.shortDescription, "Resumo loja");
  assert.equal(view.fieldSources.short_description, "store");
});

test("resolveProductFields omits disabled fields in prompt helper", () => {
  const view = resolveProductFields({
    product,
    snapshot,
    globalPolicies: [],
    productPolicies: [
      {
        id: "pol2",
        scope: "product",
        storeConnectionId: "sc1",
        productId: product.id,
        fieldKey: "long_description",
        source: "disabled",
        createdAt: "",
        updatedAt: "",
      },
    ],
  });

  assert.equal(view.longDescription, "");
  const prompt = formatResolvedProductForPrompt(view);
  assert.match(prompt, /camiseta-iris/);
  assert.doesNotMatch(prompt, /detalhes:/i);
});

test("global policy overrides default before product policy is checked", () => {
  const view = resolveProductFields({
    product,
    snapshot,
    globalPolicies: [
      {
        id: "g1",
        scope: "global",
        storeConnectionId: "sc1",
        productId: null,
        fieldKey: "price",
        source: "disabled",
        createdAt: "",
        updatedAt: "",
      },
    ],
    productPolicies: [],
  });

  assert.equal(view.price, null);
  assert.equal(view.fieldSources.price, "disabled");
});
