import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createMcpConnectionVerifier,
  generateMcpConnectionCode,
  hashMcpConnectionCode,
  mcpConnectionCodeHint,
  verifyMcpConnectionCodeHash,
} from "./mcp-connection-verifier.ts";
import { DEV_MCP_CONNECTION_CODE_DEFAULT } from "./mcp-connection.ts";

test("generateMcpConnectionCode returns 64 hex chars", () => {
  const code = generateMcpConnectionCode();
  assert.match(code, /^[0-9a-f]{64}$/);
});

test("verifyMcpConnectionCodeHash accepts matching code", () => {
  const code = "test-mcp-code";
  const hash = hashMcpConnectionCode(code, "pepper");
  assert.equal(verifyMcpConnectionCodeHash(code, hash, "pepper"), true);
  assert.equal(verifyMcpConnectionCodeHash("wrong", hash, "pepper"), false);
});

test("mcpConnectionCodeHint shows last four chars", () => {
  assert.equal(mcpConnectionCodeHint("abcdefghijklmnop"), "…mnop");
});

test("verifier uses env code in production", () => {
  const verifier = createMcpConnectionVerifier({
    envCode: "env-secret",
    nodeEnv: "production",
    getStoredHash: () => null,
    pepper: () => "pepper",
  });

  assert.equal(verifier.isConfigured(), true);
  assert.equal(verifier.verify("env-secret"), true);
  assert.equal(verifier.verify("wrong"), false);
});

test("verifier uses database hash", () => {
  const code = "db-generated-code";
  const hash = hashMcpConnectionCode(code, "pepper");
  const verifier = createMcpConnectionVerifier({
    envCode: "",
    nodeEnv: "production",
    getStoredHash: () => hash,
    pepper: () => "pepper",
  });

  assert.equal(verifier.verify(code), true);
  assert.equal(verifier.verify("wrong"), false);
});

test("verifier falls back to dev default in development", () => {
  const verifier = createMcpConnectionVerifier({
    envCode: "",
    nodeEnv: "development",
    getStoredHash: () => null,
    pepper: () => "pepper",
  });

  assert.equal(verifier.verify(DEV_MCP_CONNECTION_CODE_DEFAULT), true);
});
