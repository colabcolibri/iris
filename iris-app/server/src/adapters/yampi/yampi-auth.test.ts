import test from "node:test";
import assert from "node:assert/strict";
import {
  parseYampiMerchants,
  resolveYampiAliasFromMerchants,
} from "./yampi-auth.ts";

test("parseYampiMerchants reads merchants.data from auth/me", () => {
  const merchants = parseYampiMerchants({
    data: {
      merchants: {
        data: [
          { alias: "loja-a", name: "Loja A", active: true, domain: "loja-a.com.br" },
          { alias: "loja-b", name: "Loja B", active: false },
        ],
      },
    },
  });

  assert.equal(merchants.length, 2);
  assert.equal(merchants[0]?.alias, "loja-a");
  assert.equal(merchants[1]?.active, false);
});

test("resolveYampiAliasFromMerchants auto-picks single merchant", () => {
  const merchants = [{ alias: "unica", name: "Única", active: true, domain: null }];
  const result = resolveYampiAliasFromMerchants(merchants);
  assert.equal(result.ok, true);
  assert.equal(result.resolvedAlias, "unica");
});

test("resolveYampiAliasFromMerchants requires alias when multiple merchants", () => {
  const merchants = [
    { alias: "a", name: "A", active: true, domain: null },
    { alias: "b", name: "B", active: true, domain: null },
  ];
  const result = resolveYampiAliasFromMerchants(merchants);
  assert.equal(result.ok, false);
  assert.match(result.message, /mais de uma loja/i);
});

test("resolveYampiAliasFromMerchants validates alias membership", () => {
  const merchants = [{ alias: "loja-real", name: "Real", active: true, domain: null }];
  const result = resolveYampiAliasFromMerchants(merchants, "errada");
  assert.equal(result.ok, false);
  assert.match(result.message, /não pertence/i);
});
