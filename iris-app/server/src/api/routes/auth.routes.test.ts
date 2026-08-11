import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "../http-server.ts";
import { hashOtpCode } from "../../domain/auth/admin-otp-code.ts";
import type { EmailSender } from "../../ports/email-sender.ts";

const ADMIN = "integration-admin";
const AGENT = "integration-agent";

async function withAuthServer(
  run: (ctx: {
    baseUrl: string;
    db: import("node:sqlite").DatabaseSync;
    capture: { text: string };
  }) => Promise<void>,
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

  const { server, db, stopScheduler } = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    agentToken: AGENT,
    mediaRoot,
    emailSender,
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run({
      baseUrl,
      db,
      capture,
    });
  } finally {
    stopScheduler();
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
    await rm(mediaRoot, { recursive: true, force: true });
    delete process.env.IRIS_ADMIN_EMAIL;
    delete process.env.IRIS_SESSION_SECRET;
    delete process.env.IRIS_OTP_PEPPER;
  }
}

test("auth flow sets session cookie and allows posts access", async () => {
  await withAuthServer(async ({ baseUrl, db, capture }) => {
    const requestResponse = await fetch(`${baseUrl}/api/auth/request-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com" }),
    });
    assert.equal(requestResponse.status, 200);

    const text = capture.text;
    const match = text.match(/\b(\d{6})\b/);
    assert.ok(match);

    const confirmResponse = await fetch(`${baseUrl}/api/auth/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", code: match![1] }),
    });
    assert.equal(confirmResponse.status, 200);
    const setCookie = confirmResponse.headers.get("set-cookie");
    assert.ok(setCookie?.includes("iris_session="));

    const postsResponse = await fetch(`${baseUrl}/api/posts`, {
      headers: { Cookie: setCookie!.split(";")[0]! },
    });
    assert.equal(postsResponse.status, 200);

    const row = db
      .prepare("SELECT COUNT(*) AS total FROM admin_login_challenges")
      .get() as { total: number };
    assert.equal(row.total, 0);
  });
});

test("confirm rejects invalid code", async () => {
  await withAuthServer(async ({ baseUrl, db }) => {
    const code = "123456";
    db.prepare(`
      INSERT INTO admin_login_challenges (email, code_hash, expires_at, attempts, last_request_at)
      VALUES (?, ?, ?, 0, ?)
    `).run(
      "admin@example.com",
      hashOtpCode(code, "test-otp-pepper"),
      new Date(Date.now() + 60_000).toISOString(),
      new Date().toISOString(),
    );

    const response = await fetch(`${baseUrl}/api/auth/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", code: "000000" }),
    });
    assert.equal(response.status, 401);
  });
});

test("posts require auth without session or bearer", async () => {
  await withAuthServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/posts`);
    assert.equal(response.status, 401);
  });
});

test("GET /api/auth/me returns 401 without session", async () => {
  await withAuthServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(response.status, 401);
    const body = (await response.json()) as { error?: string };
    assert.ok(body.error);
  });
});

test("GET /api/auth/me returns email with valid session cookie", async () => {
  await withAuthServer(async ({ baseUrl, capture }) => {
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
    assert.ok(setCookie);

    const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: setCookie!.split(";")[0]! },
    });
    assert.equal(meResponse.status, 200);
    assert.deepEqual(await meResponse.json(), {
      authenticated: true,
      email: "admin@example.com",
    });
  });
});

test("request-code returns 429 when IP rate limit is exceeded", async () => {
  const { AUTH_REQUEST_CODE_IP_MAX, resetAuthIpRateLimiterForTests } = await import(
    "../../domain/auth/auth-ip-rate-limit.ts"
  );
  resetAuthIpRateLimiterForTests();

  await withAuthServer(async ({ baseUrl }) => {
    for (let i = 0; i < AUTH_REQUEST_CODE_IP_MAX; i += 1) {
      const response = await fetch(`${baseUrl}/api/auth/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `probe-${i}@example.com` }),
      });
      assert.equal(response.status, 200, `attempt ${i + 1}`);
    }

    const blocked = await fetch(`${baseUrl}/api/auth/request-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "probe-blocked@example.com" }),
    });
    assert.equal(blocked.status, 429);
    const body = (await blocked.json()) as { error?: string };
    assert.match(body.error ?? "", /Muitas tentativas deste endereço/);
    assert.ok(blocked.headers.get("retry-after"));
  });
});
