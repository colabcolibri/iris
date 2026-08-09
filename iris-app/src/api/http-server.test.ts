import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "./http-server.ts";

async function withServer(
  options: { dbPath?: string; skipMigrations?: boolean } = {},
  run: (port: number) => Promise<void>,
): Promise<void> {
  const server = createServer(options);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;

  try {
    await run(port);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /health returns ok json", async () => {
  await withServer({ dbPath: ":memory:" }, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  });
});

test("serves public/index.html at root", async () => {
  await withServer({ skipMigrations: true }, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<title>Iris<\/title>/);
  });
});

test("unknown routes return 404 json", async () => {
  await withServer({ skipMigrations: true }, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/missing-page`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "Not found" });
  });
});
