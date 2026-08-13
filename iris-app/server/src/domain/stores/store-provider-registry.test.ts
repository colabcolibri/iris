import test from "node:test";
import assert from "node:assert/strict";
import { createStoreProviderRegistry } from "./store-provider-registry.ts";
import type { StoreProvider } from "../../ports/store-provider.ts";

function stubProvider(type: "yampi"): StoreProvider {
  return {
    providerType: type,
    async testConnection() {
      return { ok: true, message: "ok" };
    },
    async listExternalProducts() {
      return { items: [], page: 1, perPage: 50, hasMore: false };
    },
    async getExternalProduct() {
      return null;
    },
  };
}

test("store provider registry resolves registered provider", () => {
  const registry = createStoreProviderRegistry([stubProvider("yampi")]);
  assert.equal(registry.get("yampi").providerType, "yampi");
  assert.deepEqual(registry.listTypes(), ["yampi"]);
});

test("store provider registry throws for unknown type", () => {
  const registry = createStoreProviderRegistry();
  assert.throws(() => registry.get("yampi"), /not registered/);
});
