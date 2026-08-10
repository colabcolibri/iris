import assert from "node:assert/strict";
import { test } from "node:test";
import { createSqliteAgentContentStore } from "./agent-content-repository.ts";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";

test("agent content store returns null when empty", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const store = createSqliteAgentContentStore(db);

    assert.equal(store.get(), null);
  } finally {
    db.close();
  }
});

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
    assert.equal(store.get()?.restrictions, "Sem desconto");
  } finally {
    db.close();
  }
});
