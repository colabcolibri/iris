import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { DATA_DIR, WORKSPACE_ROOT } from "../../paths.ts";
import { resolveDatabasePath } from "./connection.ts";

test("resolveDatabasePath defaults to workspace data/iris.db", () => {
  const prev = process.env.IRIS_DB_PATH;
  delete process.env.IRIS_DB_PATH;
  try {
    assert.equal(resolveDatabasePath(), join(DATA_DIR, "iris.db"));
  } finally {
    if (prev !== undefined) {
      process.env.IRIS_DB_PATH = prev;
    }
  }
});

test("resolveDatabasePath resolves relative env against workspace root", () => {
  const prev = process.env.IRIS_DB_PATH;
  process.env.IRIS_DB_PATH = "./data/iris.db";
  try {
    assert.equal(resolveDatabasePath(), resolve(WORKSPACE_ROOT, "./data/iris.db"));
    assert.equal(resolveDatabasePath(), join(DATA_DIR, "iris.db"));
  } finally {
    if (prev === undefined) {
      delete process.env.IRIS_DB_PATH;
    } else {
      process.env.IRIS_DB_PATH = prev;
    }
  }
});

test("resolveDatabasePath keeps absolute and memory paths", () => {
  assert.equal(resolveDatabasePath(":memory:"), ":memory:");
  assert.equal(resolveDatabasePath("/tmp/iris-test.db"), "/tmp/iris-test.db");
});
