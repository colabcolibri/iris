import { test } from "node:test";
import assert from "node:assert/strict";
import { authenticateRequest } from "./auth.ts";
import { createSessionToken } from "./session.ts";
import { IncomingMessage } from "node:http";

function mockRequest(authHeader?: string, cookie?: string): IncomingMessage {
  const headers: Record<string, string> = {};
  if (authHeader) {
    headers.authorization = authHeader;
  }
  if (cookie) {
    headers.cookie = cookie;
  }
  return { headers } as IncomingMessage;
}

const config = {
  adminToken: "admin-secret",
  agentToken: "agent-secret",
};

test("returns 401 without authorization header", () => {
  const result = authenticateRequest(mockRequest(), config);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
  }
});

test("returns 403 with invalid token", () => {
  const result = authenticateRequest(mockRequest("Bearer wrong"), config);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 403);
  }
});

test("accepts admin token", () => {
  const result = authenticateRequest(mockRequest("Bearer admin-secret"), config);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.context.role, "admin");
  }
});

test("accepts agent token", () => {
  const result = authenticateRequest(mockRequest("Bearer agent-secret"), config);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.context.role, "agent");
  }
});

test("accepts valid session cookie as admin", () => {
  process.env.IRIS_SESSION_SECRET = "test-session-secret";
  const token = createSessionToken("admin@example.com");
  const result = authenticateRequest(
    mockRequest(undefined, `iris_session=${encodeURIComponent(token)}`),
    config,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.context.role, "admin");
    assert.equal(result.context.email, "admin@example.com");
  }
  delete process.env.IRIS_SESSION_SECRET;
});
