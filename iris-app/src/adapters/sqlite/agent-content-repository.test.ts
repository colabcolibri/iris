import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";
import {
  createSqliteAgentContentStore,
  importAgentContentFromFilesystem,
} from "./agent-content-repository.ts";

test("agent content store persists in sqlite", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const store = createSqliteAgentContentStore(db);

    const saved = store.upsert({
      soul: "# Soul custom",
      page: "Página",
      knowledge: "Fatos",
      restrictions: "Sem desconto",
    });

    assert.equal(saved.soul, "# Soul custom");
    assert.equal(store.get().restrictions, "Sem desconto");
  } finally {
    db.close();
  }
});

test("agent content imports legacy filesystem on first read", () => {
  const db = openDatabase(":memory:");
  const fsRoot = mkdtempSync(join(tmpdir(), "iris-agent-legacy-"));

  try {
    runMigrations(db);
    writeFileSync(join(fsRoot, "soul.md"), "# Soul do disco", "utf8");
    writeFileSync(join(fsRoot, "page.md"), "Página do disco", "utf8");
    writeFileSync(join(fsRoot, "knowledge.md"), "", "utf8");
    writeFileSync(join(fsRoot, "restrictions.md"), "Não prometer", "utf8");

    assert.equal(importAgentContentFromFilesystem(db, fsRoot), true);

    const store = createSqliteAgentContentStore(db, { fsImportDir: fsRoot });
    const content = store.get();

    assert.equal(content.soul, "# Soul do disco");
    assert.equal(content.restrictions, "Não prometer");
  } finally {
    db.close();
  }
});
