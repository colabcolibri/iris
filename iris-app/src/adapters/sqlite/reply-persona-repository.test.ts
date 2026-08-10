import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";
import { createSqliteReplyPersonaStore } from "./reply-persona-repository.ts";
import { defaultReplyPersona } from "../../domain/reply-persona-defaults.ts";

test("reply persona store upserts and reads single row", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const store = createSqliteReplyPersonaStore(db);

    assert.equal(store.get(), null);

    const saved = store.upsert({
      brandName: "Marca X",
      signatureInstruction: "Assine com — Equipe X",
      responseLanguage: "pt-BR",
      maxChars: 400,
    });

    assert.equal(saved.brandName, "Marca X");
    assert.equal(saved.signatureInstruction, "Assine com — Equipe X");
    assert.equal(saved.responseLanguage, "pt-BR");
    assert.equal(saved.maxChars, 400);

    const again = store.get();
    assert.equal(again?.responseLanguage, "pt-BR");
  } finally {
    db.close();
  }
});

test("defaultReplyPersona uses default response language", () => {
  const persona = defaultReplyPersona();
  assert.equal(persona.responseLanguage, "pt-BR");
  assert.equal(persona.maxChars, 500);
});
