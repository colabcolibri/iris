import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertMcpConnectionCodeConfigured,
  DEV_MCP_CONNECTION_CODE_DEFAULT,
  loadMcpConnectionCodeFromEnv,
  McpConnectionConfigError,
  validateMcpConnectionCode,
} from "./mcp-connection.ts";

test("loadMcpConnectionCodeFromEnv uses env when set", () => {
  const prev = process.env.IRIS_MCP_CONNECTION_CODE;
  process.env.IRIS_MCP_CONNECTION_CODE = "  secret-code  ";
  try {
    assert.equal(loadMcpConnectionCodeFromEnv("development"), "secret-code");
  } finally {
    if (prev === undefined) {
      delete process.env.IRIS_MCP_CONNECTION_CODE;
    } else {
      process.env.IRIS_MCP_CONNECTION_CODE = prev;
    }
  }
});

test("loadMcpConnectionCodeFromEnv defaults in development", () => {
  const prev = process.env.IRIS_MCP_CONNECTION_CODE;
  delete process.env.IRIS_MCP_CONNECTION_CODE;
  try {
    assert.equal(
      loadMcpConnectionCodeFromEnv("development"),
      DEV_MCP_CONNECTION_CODE_DEFAULT,
    );
  } finally {
    if (prev === undefined) {
      delete process.env.IRIS_MCP_CONNECTION_CODE;
    } else {
      process.env.IRIS_MCP_CONNECTION_CODE = prev;
    }
  }
});

test("loadMcpConnectionCodeFromEnv returns empty in production without env", () => {
  const prev = process.env.IRIS_MCP_CONNECTION_CODE;
  delete process.env.IRIS_MCP_CONNECTION_CODE;
  try {
    assert.equal(loadMcpConnectionCodeFromEnv("production"), "");
  } finally {
    if (prev === undefined) {
      delete process.env.IRIS_MCP_CONNECTION_CODE;
    } else {
      process.env.IRIS_MCP_CONNECTION_CODE = prev;
    }
  }
});

test("assertMcpConnectionCodeConfigured throws in production without code or stored config", () => {
  assert.throws(
    () => assertMcpConnectionCodeConfigured("production", ""),
    McpConnectionConfigError,
  );
});

test("assertMcpConnectionCodeConfigured passes with stored config in production", () => {
  assert.doesNotThrow(() =>
    assertMcpConnectionCodeConfigured("production", "", { hasStoredConfig: true }),
  );
});

test("assertMcpConnectionCodeConfigured passes with code", () => {
  assert.doesNotThrow(() =>
    assertMcpConnectionCodeConfigured("production", "abc"),
  );
});

test("validateMcpConnectionCode rejects wrong code", () => {
  assert.equal(validateMcpConnectionCode("wrong", "expected"), false);
});

test("validateMcpConnectionCode accepts matching code", () => {
  assert.equal(validateMcpConnectionCode("expected", "expected"), true);
});
