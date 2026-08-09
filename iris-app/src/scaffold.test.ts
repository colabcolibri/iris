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
  "public",
  "migrations",
  "publications/_example",
];

test("required SRP directories exist", () => {
  for (const dir of REQUIRED_DIRS) {
    assert.ok(existsSync(dir), `missing ${dir}`);
  }
});

test("publications example template exists", () => {
  assert.ok(existsSync("publications/_example/post.md"));
});

test("createServer returns an http server", () => {
  const { server } = createServer({ skipMigrations: true });
  assert.equal(typeof server.listen, "function");
  server.close();
});
