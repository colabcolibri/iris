import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "../http-server.ts";
import type { EmailSender } from "../../ports/email-sender.ts";

const AGENT = "integration-agent";

async function withSettingsServer(
  run: (ctx: { baseUrl: string; adminCookie: string }) => Promise<void>,
  options?: { mcpConnectionCode?: string },
): Promise<void> {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-settings-"));
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

  const { server, stopScheduler } = createServer({
    dbPath: ":memory:",
    adminToken: "admin-token",
    agentToken: AGENT,
    mediaRoot,
    emailSender,
    startScheduler: false,
    mcpConnectionCode: options?.mcpConnectionCode,
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
  const adminCookie = confirmResponse.headers.get("set-cookie")!.split(";")[0]!;

  try {
    await run({ baseUrl, adminCookie });
  } finally {
    stopScheduler();
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
    await rm(mediaRoot, { recursive: true, force: true });
  }
}

test("GET mcp settings returns development default when empty", async () => {
  const prevNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    await withSettingsServer(async ({ baseUrl, adminCookie }) => {
      const response = await fetch(`${baseUrl}/api/settings/mcp`, {
        headers: { Cookie: adminCookie },
      });
      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        configured: boolean;
        source: string | null;
        mcp_path: string;
      };
      assert.equal(body.configured, true);
      assert.equal(body.source, "development_default");
      assert.equal(body.mcp_path, "/mcp");
    }, { mcpConnectionCode: "" });
  } finally {
    if (prevNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = prevNodeEnv;
    }
    delete process.env.IRIS_TOKEN_ENCRYPTION_KEY;
  }
});

test("POST mcp settings generates code and validate accepts it", async () => {
  const prevNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  process.env.IRIS_TOKEN_ENCRYPTION_KEY = "test-encryption-key-32-chars-min!!";
  try {
    await withSettingsServer(async ({ baseUrl, adminCookie }) => {
    const generateResponse = await fetch(`${baseUrl}/api/settings/mcp`, {
      method: "POST",
      headers: { Cookie: adminCookie },
    });
    assert.equal(generateResponse.status, 200);
    const generated = (await generateResponse.json()) as {
      connection_code: string;
      mcp_url: string;
    };
    assert.ok(generated.connection_code.length >= 32);

    const validateResponse = await fetch(`${baseUrl}/api/mcp/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionCode: generated.connection_code }),
    });
    assert.equal(validateResponse.status, 200);

    const mcpResponse = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${generated.connection_code}`,
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });
    assert.equal(mcpResponse.status, 200);
    }, { mcpConnectionCode: "" });
  } finally {
    if (prevNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = prevNodeEnv;
    }
    delete process.env.IRIS_TOKEN_ENCRYPTION_KEY;
  }
});

test("agent cannot manage mcp settings", async () => {
  await withSettingsServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/settings/mcp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${AGENT}` },
    });
    assert.equal(response.status, 403);
  });
});

test("DELETE mcp settings revokes generated code", async () => {
  const prevNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  process.env.IRIS_TOKEN_ENCRYPTION_KEY = "test-encryption-key-32-chars-min!!";
  try {
    await withSettingsServer(async ({ baseUrl, adminCookie }) => {
    const generateResponse = await fetch(`${baseUrl}/api/settings/mcp`, {
      method: "POST",
      headers: { Cookie: adminCookie },
    });
    const generated = (await generateResponse.json()) as { connection_code: string };

    const deleteResponse = await fetch(`${baseUrl}/api/settings/mcp`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert.equal(deleteResponse.status, 200);

    const validateResponse = await fetch(`${baseUrl}/api/mcp/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionCode: generated.connection_code }),
    });
    assert.equal(validateResponse.status, 503);
    }, { mcpConnectionCode: "" });
  } finally {
    if (prevNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = prevNodeEnv;
    }
    delete process.env.IRIS_TOKEN_ENCRYPTION_KEY;
  }
});
