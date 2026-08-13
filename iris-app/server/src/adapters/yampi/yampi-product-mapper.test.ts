import test from "node:test";
import assert from "node:assert/strict";
import { mapYampiProduct } from "./yampi-product-mapper.ts";

test("mapYampiProduct maps common catalog fields", () => {
  const mapped = mapYampiProduct({
    id: 42,
    name: "Camiseta Iris",
    slug: "camiseta-iris",
    url: "https://loja.example/p/camiseta",
    texts: {
      data: {
        short_description: "Resumo loja",
        description: "Descrição longa",
      },
    },
    skus: {
      data: [{ sku: "SKU-1", price_sale: 129.9 }],
    },
    images: {
      data: [{ url: "https://cdn.example/img.jpg" }],
    },
  });

  assert.ok(mapped);
  assert.equal(mapped!.externalId, "42");
  assert.equal(mapped!.name, "Camiseta Iris");
  assert.equal(mapped!.shortDescription, "Resumo loja");
  assert.equal(mapped!.longDescription, "Descrição longa");
  assert.equal(mapped!.sku, "SKU-1");
  assert.match(mapped!.price ?? "", /129/);
  assert.equal(mapped!.url, "https://loja.example/p/camiseta");
  assert.equal(mapped!.imageUrl, "https://cdn.example/img.jpg");
});
