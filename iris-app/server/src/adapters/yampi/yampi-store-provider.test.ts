import test from "node:test";
import assert from "node:assert/strict";
import { createYampiClient } from "./yampi-client.ts";
import { createYampiStoreProvider } from "./yampi-store-provider.ts";

const credentials = {
  alias: "demo-store",
  userToken: "token",
  userSecretKey: "secret",
};

const merchantsPayload = {
  data: {
    merchants: {
      data: [{ alias: "demo-store", name: "Demo Store", active: true, domain: "demo.example" }],
    },
  },
};

test("yampi store provider testConnection validates alias against auth/me and probes catalog", async () => {
  const calls: string[] = [];
  const client = createYampiClient({
    fetchImpl: (async (url) => {
      calls.push(String(url));
      if (String(url).includes("/auth/me")) {
        return new Response(JSON.stringify(merchantsPayload), { status: 200 });
      }
      if (String(url).includes("/catalog/products")) {
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    }) as typeof fetch,
  });

  const provider = createYampiStoreProvider(client);
  const result = await provider.testConnection({
    providerType: "yampi",
    yampi: credentials,
  });

  assert.equal(result.ok, true);
  assert.equal(result.resolved_alias, "demo-store");
  assert.equal(result.merchants?.length, 1);
  assert.ok(calls.some((url) => url.includes("/auth/me")));
  assert.ok(calls.some((url) => url.includes("/demo-store/catalog/products")));
});

test("yampi store provider testConnection rejects unknown alias", async () => {
  const client = createYampiClient({
    fetchImpl: (async (url) => {
      if (String(url).includes("/auth/me")) {
        return new Response(JSON.stringify(merchantsPayload), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    }) as typeof fetch,
  });

  const provider = createYampiStoreProvider(client);
  const result = await provider.testConnection({
    providerType: "yampi",
    yampi: { ...credentials, alias: "outra-loja" },
  });

  assert.equal(result.ok, false);
  assert.match(result.message, /não pertence/i);
});

test("yampi store provider lists mapped products", async () => {
  const client = createYampiClient({
    fetchImpl: (async () =>
      new Response(
        JSON.stringify({
          data: [{ id: 7, name: "Produto", skus: { data: [] }, texts: { data: {} } }],
          meta: { pagination: { current_page: 1, per_page: 50, total_pages: 1 } },
        }),
        { status: 200 },
      )) as typeof fetch,
  });

  const provider = createYampiStoreProvider(client);
  const page = await provider.listExternalProducts(
    { providerType: "yampi", yampi: credentials },
    { page: 1, perPage: 50 },
  );

  assert.equal(page.items.length, 1);
  assert.equal(page.items[0]?.externalId, "7");
  assert.equal(page.hasMore, false);
});
