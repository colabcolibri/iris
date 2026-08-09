import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "./http-server.ts";

const ADMIN = "test-admin-token";
const AGENT = "test-agent-token";

async function withServer(
  run: (port: number) => Promise<void>,
  options: { dbPath?: string } = {},
): Promise<void> {
  const { server, stopScheduler } = createServer({
    dbPath: options.dbPath ?? ":memory:",
    adminToken: ADMIN,
    agentToken: AGENT,
    mediaRoot: `${process.cwd()}/tmp-test-media`,
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;

  try {
    await run(port);
  } finally {
    stopScheduler();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /health returns ok json", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  });
});

test("serves public/index.html at root", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<title>Iris<\/title>/);
  });
});

test("unknown routes return 404 json", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/missing-page`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "Not found" });
  });
});

test("api requires authorization", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/posts`);
    assert.equal(response.status, 401);
  });
});

test("api rejects invalid token", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/posts`, {
      headers: { Authorization: "Bearer invalid" },
    });
    assert.equal(response.status, 403);
  });
});
