import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../http-server.ts";

const ADMIN = "store-admin";

function yampiMerchantsResponse(alias = "demo") {
  return {
    data: {
      merchants: {
        data: [{ alias, name: "Loja demo", active: true, domain: "demo.example" }],
      },
    },
  };
}

function installYampiFetchMock(alias = "demo") {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    if (!url.includes("api.dooki.com.br")) {
      return originalFetch(input, init);
    }
    if (url.includes("/auth/me")) {
      return new Response(JSON.stringify(yampiMerchantsResponse(alias)), { status: 200 });
    }
    if (url.includes("/catalog/products")) {
      return new Response(
        JSON.stringify({
          data: [{ id: 9, name: "Produto remoto", skus: { data: [] }, texts: { data: {} } }],
          meta: { pagination: { current_page: 1, per_page: 50, total_pages: 1 } },
        }),
        { status: 200 },
      );
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

async function withServer(
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const handle = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    encryptionKey: "d".repeat(64),
    startScheduler: false,
  });

  await new Promise<void>((resolve) => {
    handle.server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = handle.server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    handle.stopScheduler();
    await new Promise<void>((resolve, reject) => {
      handle.server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/store-connections creates yampi connection without returning secrets", async () => {
  const restoreFetch = installYampiFetchMock("demo");
  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/store-connections`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ADMIN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider_type: "yampi",
          label: "Minha loja",
          alias: "demo",
          user_token: "secret-token",
          user_secret_key: "secret-key",
        }),
      });

      assert.equal(response.status, 201);
      const body = (await response.json()) as {
        label: string;
        has_credentials: boolean;
        yampi_alias: string | null;
        user_token?: string;
      };
      assert.equal(body.label, "Minha loja");
      assert.equal(body.has_credentials, true);
      assert.equal(body.yampi_alias, "demo");
      assert.equal(body.user_token, undefined);
    });
  } finally {
    restoreFetch();
  }
});

test("POST /api/store-connections/yampi/discover resolves alias for single merchant", async () => {
  const restoreFetch = installYampiFetchMock("demo");
  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/store-connections/yampi/discover`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ADMIN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_token: "token",
          user_secret_key: "secret",
        }),
      });

      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        merchants: Array<{ alias: string }>;
        resolved_alias: string | null;
      };
      assert.equal(body.merchants.length, 1);
      assert.equal(body.resolved_alias, "demo");
    });
  } finally {
    restoreFetch();
  }
});

test("POST /api/store-connections/:id/sync imports products when import_new=true", async () => {
  const restoreFetch = installYampiFetchMock("demo");
  try {
    await withServer(async (baseUrl) => {
      const createResponse = await fetch(`${baseUrl}/api/store-connections`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ADMIN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider_type: "yampi",
          label: "Loja sync",
          alias: "demo",
          user_token: "token",
          user_secret_key: "secret",
        }),
      });
      const created = (await createResponse.json()) as { id: string };

      const syncResponse = await fetch(
        `${baseUrl}/api/store-connections/${created.id}/sync?import_new=true`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${ADMIN}` },
        },
      );

      assert.equal(syncResponse.status, 200);
      const syncBody = (await syncResponse.json()) as { imported: number };
      assert.equal(syncBody.imported, 1);

      const productsResponse = await fetch(`${baseUrl}/api/products`, {
        headers: { Authorization: `Bearer ${ADMIN}` },
      });
      const productsBody = (await productsResponse.json()) as { products: unknown[] };
      assert.equal(productsBody.products.length, 1);
    });
  } finally {
    restoreFetch();
  }
});
