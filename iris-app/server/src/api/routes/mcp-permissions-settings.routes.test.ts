import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "../http-server.ts";
import type { EmailSender } from "../ports/email-sender.ts";

const MCP_CODE = "mcp-permissions-test-code";

async function withAdminSession(
  run: (ctx: { baseUrl: string; adminCookie: string }) => Promise<void>,
): Promise<void> {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-permissions-"));
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
    agentToken: "agent",
    mediaRoot,
    emailSender,
    startScheduler: false,
    mcpConnectionCode: MCP_CODE,
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

test("GET mcp permissions returns full preset by default", async () => {
  await withAdminSession(async ({ baseUrl, adminCookie }) => {
    const response = await fetch(`${baseUrl}/api/settings/mcp/permissions`, {
      headers: { Cookie: adminCookie },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      preset: string;
      domains: Array<{ id: string; permissions: { write: boolean } }>;
    };

    assert.equal(body.preset, "full");
    assert.equal(
      body.domains.find((domain) => domain.id === "posts")?.permissions.write,
      true,
    );
  });
});

test("PUT read_only preset blocks write tools in tools/list", async () => {
  await withAdminSession(async ({ baseUrl, adminCookie }) => {
    const saveResponse = await fetch(`${baseUrl}/api/settings/mcp/permissions`, {
      method: "PUT",
      headers: {
        Cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ preset: "read_only" }),
    });
    assert.equal(saveResponse.status, 200);

    const listResponse = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${MCP_CODE}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 7,
        method: "tools/list",
        params: {},
      }),
    });

    assert.equal(listResponse.status, 200);
    const listBody = (await listResponse.json()) as {
      result: { tools: Array<{ name: string }> };
    };
    const toolNames = listBody.result.tools.map((tool) => tool.name);

    assert.ok(toolNames.includes("iris_list_posts"));
    assert.ok(!toolNames.includes("iris_create_post"));
    assert.ok(!toolNames.includes("iris_delete_product"));
  });
});

test("tools/call returns permission denied for blocked write tool", async () => {
  await withAdminSession(async ({ baseUrl, adminCookie }) => {
    await fetch(`${baseUrl}/api/settings/mcp/permissions`, {
      method: "PUT",
      headers: {
        Cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ preset: "read_only" }),
    });

    const callResponse = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${MCP_CODE}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 9,
        method: "tools/call",
        params: {
          name: "iris_create_post",
          arguments: { caption: "blocked" },
        },
      }),
    });

    assert.equal(callResponse.status, 200);
    const callBody = (await callResponse.json()) as {
      result: { isError: boolean; content: Array<{ text: string }> };
    };

    assert.equal(callBody.result.isError, true);
    assert.match(
      callBody.result.content[0]?.text ?? "",
      /permission denied: posts:write/,
    );
  });
});
