import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHmac } from "node:crypto";
import { createServer } from "../http-server.ts";
import { hashOtpCode } from "../../domain/auth/admin-otp-code.ts";
import type { EmailSender } from "../../ports/email-sender.ts";

const ADMIN = "integration-admin";
const AGENT = "integration-agent";

async function loginAdmin(baseUrl: string, capture: { text: string }): Promise<string> {
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

  const setCookie = confirmResponse.headers.get("set-cookie");
  assert.ok(setCookie?.includes("iris_session="));
  return setCookie!.split(";")[0]!;
}

async function withMetaServer(
  run: (ctx: {
    baseUrl: string;
    db: import("node:sqlite").DatabaseSync;
    capture: { text: string };
  }) => Promise<void>,
  fetchImpl?: typeof fetch,
): Promise<void> {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-media-"));
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
  process.env.META_APP_ID = "app-test";
  process.env.META_APP_SECRET = "secret-test";
  process.env.META_OAUTH_REDIRECT_URI = "http://127.0.0.1/oauth/callback";
  process.env.META_GRAPH_API_VERSION = "v21.0";

  const originalFetch = globalThis.fetch;
  if (fetchImpl) {
    globalThis.fetch = fetchImpl;
  }

  const { server, db, stopScheduler } = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    agentToken: AGENT,
    mediaRoot,
    emailSender,
    publicBaseUrl: "http://127.0.0.1:8792",
    publishUrlSecret: "publish-secret",
    startScheduler: false,
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run({ baseUrl, db, capture });
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
    delete process.env.META_APP_ID;
    delete process.env.META_APP_SECRET;
    delete process.env.META_OAUTH_REDIRECT_URI;
    delete process.env.META_GRAPH_API_VERSION;
  }
}

test("meta auth redirect requires session", async () => {
  await withMetaServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/auth/meta`, { redirect: "manual" });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/admin/login");
  });
});

test("meta oauth callback stores token and connection", async () => {
  const originalFetch = globalThis.fetch;
  const graphFetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input.toString());

    if (url.hostname === "api.instagram.com" && url.pathname === "/oauth/access_token") {
      return new Response(
        JSON.stringify({
          data: [{ access_token: "short-user", user_id: "ig-42" }],
        }),
        { status: 200 },
      );
    }

    if (url.hostname === "graph.instagram.com" && url.pathname === "/access_token") {
      return new Response(
        JSON.stringify({ access_token: "long-user", expires_in: 3600 }),
        { status: 200 },
      );
    }

    if (url.hostname === "graph.instagram.com" && url.pathname.endsWith("/me")) {
      return new Response(
        JSON.stringify({ user_id: "ig-42", username: "brandig" }),
        { status: 200 },
      );
    }

    return new Response(JSON.stringify({ error: { message: "unexpected" } }), {
      status: 400,
    });
  };

  const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    if (
      url.hostname === "graph.instagram.com" ||
      url.hostname === "api.instagram.com" ||
      url.hostname === "www.instagram.com"
    ) {
      return graphFetchImpl(input, init);
    }
    return originalFetch(input, init);
  };

  await withMetaServer(async ({ baseUrl, db }) => {
    const expiresMs = Date.now() + 60_000;
    const payload = `oauth1-ig.${expiresMs}`;
    const signature = createHmac("sha256", "test-session-secret")
      .update(payload)
      .digest("base64url");
    const state = `${payload}.${signature}.nonce`;

    const response = await fetch(
      `${baseUrl}/auth/meta/callback?code=oauth-code&state=${encodeURIComponent(state)}`,
      { redirect: "manual" },
    );

    assert.equal(response.status, 302);
    assert.match(response.headers.get("location") ?? "", /meta_connected=1/);

    const tokenCount = db
      .prepare("SELECT COUNT(*) AS total FROM meta_tokens")
      .get() as { total: number };
    assert.equal(tokenCount.total, 1);

    const connection = db
      .prepare("SELECT ig_user_id, ig_username FROM meta_connection WHERE id = 'primary'")
      .get() as { ig_user_id: string; ig_username: string };
    assert.equal(connection.ig_user_id, "ig-42");
    assert.equal(connection.ig_username, "brandig");
  }, fetchImpl);
});
