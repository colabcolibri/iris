import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "../http-server.ts";

const MCP_CODE = "test-mcp-connection-code";

async function withMcpServer(
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-media-"));

  const { server, stopScheduler } = createServer({
    dbPath: ":memory:",
    adminToken: "admin",
    agentToken: "agent",
    mediaRoot,
    mcpConnectionCode: MCP_CODE,
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    stopScheduler();
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
    await rm(mediaRoot, { recursive: true, force: true });
  }
}

test("POST /api/mcp/validate accepts valid connection code", async () => {
  await withMcpServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/mcp/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionCode: MCP_CODE }),
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      valid: boolean;
      server: string;
      mcpPath: string;
    };
    assert.equal(body.valid, true);
    assert.equal(body.server, "iris");
    assert.equal(body.mcpPath, "/mcp");
  });
});

test("POST /api/mcp/validate rejects invalid connection code", async () => {
  await withMcpServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/mcp/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionCode: "wrong" }),
    });

    assert.equal(response.status, 401);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, "Invalid connection code");
  });
});

test("POST /api/mcp/validate rejects empty body", async () => {
  await withMcpServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/mcp/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 401);
  });
});
