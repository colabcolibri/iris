import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";
import { createSqliteLlmSettingsStore } from "./llm-settings-repository.ts";

const TEST_KEY = "a".repeat(64);

test("llm settings vault does not store plaintext api key", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const store = createSqliteLlmSettingsStore(db, { encryptionKey: TEST_KEY });
    store.upsert({
      apiKey: "sk-secret-value-9999",
      apiUrl: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini",
      supportsVision: false,
    });

    const row = db
      .prepare("SELECT api_key_vault FROM llm_settings WHERE id = 'default'")
      .get() as { api_key_vault: string };

    assert.notEqual(row.api_key_vault, "sk-secret-value-9999");
    assert.equal(store.get()?.apiKey, "sk-secret-value-9999");
  } finally {
    db.close();
  }
});
