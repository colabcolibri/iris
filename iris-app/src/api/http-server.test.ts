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

test("protected spa routes redirect to login without session", async () => {
  await withServer(async (port) => {
    for (const path of ["/admin", "/admin/comments", "/admin/settings", "/admin/persona"]) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        redirect: "manual",
      });
      assert.equal(response.status, 302, path);
      assert.equal(response.headers.get("location"), "/admin/login", path);
    }
  });
});

test("landing page remains accessible without session", async () => {
  await withServer(async (port) => {
    for (const path of ["/", "/en"]) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`);
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.match(html, /<title>Iris<\/title>/, path);
      assert.match(html, /id="root"/, path);
    }
  });
});

test("public spa routes remain accessible without session", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/admin/login`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<title>Iris<\/title>/);
    assert.match(html, /id="root"/);
  });
});

test("protected spa routes serve index.html with valid session cookie", async () => {
  process.env.IRIS_ADMIN_EMAIL = "admin@example.com";
  process.env.IRIS_SESSION_SECRET = "test-session-secret";
  process.env.IRIS_OTP_PEPPER = "test-otp-pepper";

  const capture = { text: "" };
  const emailSender = {
    async send(input: { text: string }) {
      capture.text = input.text;
      return { ok: true as const };
    },
  };

  const { server, stopScheduler } = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    agentToken: AGENT,
    mediaRoot: `${process.cwd()}/tmp-test-media`,
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

    const response = await fetch(`${baseUrl}/admin`, {
      headers: { Cookie: setCookie!.split(";")[0]! },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<title>Iris<\/title>/);
  } finally {
    stopScheduler();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    delete process.env.IRIS_ADMIN_EMAIL;
    delete process.env.IRIS_SESSION_SECRET;
    delete process.env.IRIS_OTP_PEPPER;
  }
});

test("spa routes fall back to index.html", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/admin/login`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<title>Iris<\/title>/);
    assert.match(html, /id="root"/);
  });
});

test("redirects legacy /login.html to /admin/login", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/login.html`, {
      redirect: "manual",
    });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/admin/login");
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
