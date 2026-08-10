import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../http-server.ts";

const ADMIN = "sse-admin-token";
const AGENT = "sse-agent-token";

test("POST post emits posts-changed SSE event", async () => {
  const { server, stopScheduler } = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    agentToken: AGENT,
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const eventsResponse = await fetch(`${baseUrl}/api/events`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });

    assert.equal(eventsResponse.status, 200);
    assert.match(
      eventsResponse.headers.get("content-type") ?? "",
      /text\/event-stream/,
    );
    assert.equal(eventsResponse.headers.get("x-accel-buffering"), "no");
    assert.match(
      eventsResponse.headers.get("cache-control") ?? "",
      /no-cache/,
    );

    const reader = eventsResponse.body?.getReader();
    assert.ok(reader);

    const createPromise = fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AGENT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ caption: "sse test", channel: "instagram" }),
    });

    let received = false;
    const decoder = new TextDecoder();
    let buffer = "";

    const readWithTimeout = async () => {
      const timeout = Date.now() + 5000;
      while (Date.now() < timeout) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        if (buffer.includes("event: posts-changed")) {
          received = true;
          break;
        }
      }
    };

    const [, createResponse] = await Promise.all([readWithTimeout(), createPromise]);
    assert.equal(createResponse.status, 201);
    assert.equal(received, true);
    reader.cancel();
  } finally {
    stopScheduler();
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
  }
});

test("GET /api/events requires admin token", async () => {
  const { server, stopScheduler } = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    agentToken: AGENT,
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/events`, {
      headers: { Authorization: `Bearer ${AGENT}` },
    });
    assert.equal(response.status, 403);
  } finally {
    stopScheduler();
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
  }
});
