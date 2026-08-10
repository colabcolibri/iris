import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "../http-server.ts";
import type { EmailSender } from "../../ports/email-sender.ts";
import { createSqliteMetaTokenStore } from "../../adapters/sqlite/meta-token-repository.ts";
import { createSqliteMetaConnectionStore } from "../../adapters/sqlite/meta-connection-repository.ts";

const TEST_KEY = "c".repeat(64);

async function withMetaApiServer(
  run: (ctx: {
    baseUrl: string;
    cookie: string;
    db: import("node:sqlite").DatabaseSync;
  }) => Promise<void>,
  fetchImpl?: typeof fetch,
): Promise<void> {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-meta-api-"));
  const capture = { text: "" };
  const emailSender: EmailSender = {
    async send(input) {
      capture.text = input.text;
      return { ok: true };
    },
  };

  process.env.IRIS_ADMIN_EMAIL = "admin@example.com";
  process.env.IRIS_SESSION_SECRET = "test-session-secret";
  process.env.IRIS_OTP_PEPPER = "test-otp-pepper";

  const originalFetch = globalThis.fetch;
  if (fetchImpl) {
    globalThis.fetch = fetchImpl;
  }

  const { server, db, stopScheduler } = createServer({
    dbPath: ":memory:",
    agentToken: "agent",
    mediaRoot,
    emailSender,
    encryptionKey: TEST_KEY,
    startScheduler: false,
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;
  const baseUrl = `http://127.0.0.1:${port}`;

  await fetch(`${baseUrl}/api/auth/request-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com" }),
  });
  const match = capture.text.match(/\b(\d{6})\b/);
  assert.ok(match);
  const confirmResponse = await fetch(`${baseUrl}/api/auth/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", code: match![1] }),
  });
  const cookie = confirmResponse.headers.get("set-cookie")!.split(";")[0]!;

  try {
    await run({ baseUrl, cookie, db });
  } finally {
    stopScheduler();
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
    await rm(mediaRoot, { recursive: true, force: true });
    globalThis.fetch = originalFetch;
    delete process.env.IRIS_ADMIN_EMAIL;
    delete process.env.IRIS_SESSION_SECRET;
    delete process.env.IRIS_OTP_PEPPER;
  }
}

test("meta status reports disconnected without token", async () => {
  await withMetaApiServer(async ({ baseUrl, cookie }) => {
    const response = await fetch(`${baseUrl}/api/meta/status`, {
      headers: { Cookie: cookie },
    });
    assert.equal(response.status, 200);
    const json = (await response.json()) as { connected: boolean };
    assert.equal(json.connected, false);
  });
});

test("meta status reports connected account", async () => {
  await withMetaApiServer(async ({ baseUrl, cookie, db }) => {
    const tokenStore = createSqliteMetaTokenStore(db, { encryptionKey: TEST_KEY });
    tokenStore.upsertToken("page-token", new Date(Date.now() + 3600_000).toISOString());

    const connectionStore = createSqliteMetaConnectionStore(db);
    connectionStore.upsert({
      igUserId: "ig-7",
      igUsername: "brand",
      pageId: "page-1",
      pageName: "Brand",
    });

    const response = await fetch(`${baseUrl}/api/meta/status`, {
      headers: { Cookie: cookie },
    });
    const json = (await response.json()) as {
      connected: boolean;
      igUsername: string;
    };
    assert.equal(json.connected, true);
    assert.equal(json.igUsername, "brand");
  });
});

test("meta health returns ok when graph responds", async () => {
  const originalFetch = globalThis.fetch;
  const graphFetchImpl = async () =>
    new Response(JSON.stringify({ user_id: "ig-7", username: "brand" }), {
      status: 200,
    });
  const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    if (url.hostname === "graph.instagram.com") {
      return graphFetchImpl();
    }
    return originalFetch(input, init);
  };

  await withMetaApiServer(async ({ baseUrl, cookie, db }) => {
    const tokenStore = createSqliteMetaTokenStore(db, { encryptionKey: TEST_KEY });
    tokenStore.upsertToken("page-token");

    const connectionStore = createSqliteMetaConnectionStore(db);
    connectionStore.upsert({
      igUserId: "ig-7",
      igUsername: "brand",
      pageId: "page-1",
      pageName: "Brand",
    });

    const response = await fetch(`${baseUrl}/api/meta/health`, {
      headers: { Cookie: cookie },
    });
    const json = (await response.json()) as { ok: boolean; code: string };
    assert.equal(json.ok, true);
    assert.equal(json.code, "ok");
  }, fetchImpl);
});
