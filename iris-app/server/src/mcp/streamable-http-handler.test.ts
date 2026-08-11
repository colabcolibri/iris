import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "../api/http-server.ts";

const MCP_CODE = "mcp-handshake-code";

const MCP_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
  Authorization: `Bearer ${MCP_CODE}`,
};

async function withMcpServer(
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-http-"));

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

test("POST /mcp rejects missing bearer token", async () => {
  await withMcpServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });

    assert.equal(response.status, 401);
  });
});

test("POST /mcp completes initialize with valid bearer", async () => {
  await withMcpServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      result?: { serverInfo?: { name?: string } };
    };
    assert.equal(body.result?.serverInfo?.name, "iris");
  });
});

test("POST /mcp accepts tunnel host header in development", async () => {
  const prevNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    await withMcpServer(async (baseUrl) => {
      const address = new URL(baseUrl);
      const body = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "ngrok-test", version: "1.0.0" },
        },
      });

      const status = await new Promise<number>((resolve, reject) => {
        import("node:http").then(({ request }) => {
          const req = request(
            {
              hostname: address.hostname,
              port: address.port,
              path: "/mcp",
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json, text/event-stream",
                Authorization: `Bearer ${MCP_CODE}`,
                Host: "example.ngrok-free.app",
              },
            },
            (res) => {
              res.on("data", () => undefined);
              res.on("end", () => resolve(res.statusCode ?? 0));
            },
          );
          req.on("error", reject);
          req.write(body);
          req.end();
        });
      });

      assert.equal(status, 200);
    });
  } finally {
    if (prevNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = prevNodeEnv;
    }
  }
});

test("POST /mcp lists registered tools", async () => {
  await withMcpServer(async (baseUrl) => {
    const headers = MCP_HEADERS;

    const initResponse = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });
    assert.equal(initResponse.status, 200);

    const toolsResponse = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
    });

    assert.equal(toolsResponse.status, 200);
    const body = (await toolsResponse.json()) as {
      result?: { tools?: Array<{ name: string }> };
    };
    const names = body.result?.tools?.map((tool) => tool.name) ?? [];
    assert.ok(names.includes("iris_list_posts"));
    assert.ok(names.includes("iris_prepare_post_asset_upload"));
    assert.ok(names.includes("iris_list_post_assets"));
    assert.ok(names.includes("iris_delete_post_asset"));
    assert.ok(names.includes("iris_generate_post_carousel_summary"));
  });
});
