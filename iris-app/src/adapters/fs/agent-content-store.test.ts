import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createFsAgentContentStore } from "./agent-content-store.ts";

test("agent content store round-trips four markdown fields", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "iris-agent-content-"));
  try {
    const store = createFsAgentContentStore({ rootDir });
    const defaults = store.get();
    assert.ok(defaults.soul.length > 0);

    const saved = store.upsert({
      soul: "# SOUL\nAgente Iris",
      page: "Página de testes",
      knowledge: "FAQ item 1",
      restrictions: "Sem spam",
    });

    assert.equal(saved.soul, "# SOUL\nAgente Iris");
    assert.equal(store.get().knowledge, "FAQ item 1");
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});
