import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createServer } from "./api/http-server.ts";

const REQUIRED_DIRS = [
  "src/domain",
  "src/ports",
  "src/adapters/sqlite",
  "src/adapters/media-storage",
  "src/adapters/image-optimizer",
  "src/adapters/meta",
  "src/adapters/sse",
  "src/api/routes",
  "src/workers",
  "src/agents",
  "migrations",
  "../public",
  "../admin",
];

test("required SRP directories exist", () => {
  for (const dir of REQUIRED_DIRS) {
    assert.ok(existsSync(dir), `missing ${dir}`);
  }
});

test("createServer returns an http server", () => {
  const { server, stopScheduler } = createServer({ dbPath: ":memory:" });
  stopScheduler();
  assert.equal(typeof server.listen, "function");
  server.close();
});
