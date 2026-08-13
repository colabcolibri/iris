import test from "node:test";
import assert from "node:assert/strict";
import { createYampiClient } from "./yampi-client.ts";
import { createYampiStoreProvider } from "./yampi-store-provider.ts";

const credentials = {
  alias: "demo-store",
  userToken: "token",
  userSecretKey: "secret",
};

test("yampi store provider testConnection uses auth/me", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const client = createYampiClient({
    fetchImpl: (async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ data: { id: 1 } }), { status: 200 });
    }) as typeof fetch,
  });

  const provider = createYampiStoreProvider(client);
  const result = await provider.testConnection({
    providerType: "yampi",
    yampi: credentials,
  });

  assert.equal(result.ok, true);
  assert.equal(calls[0]?.url, "https://api.dooki.com.br/v2/auth/me");
  assert.equal((calls[0]?.init?.headers as Record<string, string>)["User-Token"], "token");
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
