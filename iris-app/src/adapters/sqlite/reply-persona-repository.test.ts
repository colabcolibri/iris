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
      systemPrompt: "Responda como marca X",
      tone: "casual",
      brandName: "Marca X",
      maxChars: 400,
    });

    assert.equal(saved.systemPrompt, "Responda como marca X");
    assert.equal(saved.maxChars, 400);

    const again = store.get();
    assert.equal(again?.tone, "casual");
  } finally {
    db.close();
  }
});

test("defaultReplyPersona matches env tone fallback", () => {
  const persona = defaultReplyPersona();
  assert.ok(persona.systemPrompt.length > 10);
  assert.equal(persona.maxChars, 500);
});
