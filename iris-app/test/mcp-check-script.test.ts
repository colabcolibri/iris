import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("iris-mcp-check.sh exists and targets validate endpoint", async () => {
  const scriptPath = join(REPO_ROOT, "iris-agent/scripts/iris-mcp-check.sh");
  const content = await readFile(scriptPath, "utf8");
  assert.match(content, /\/api\/mcp\/validate/);
  assert.match(content, /mcpConnectionCode/);
});
