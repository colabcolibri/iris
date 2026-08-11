import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";
import {
  bootstrapMetaTokenFromEnv,
  createSqliteMetaTokenStore,
} from "./meta-token-repository.ts";

const TEST_KEY = "a".repeat(64);

test("encrypts token vault — plaintext not stored in db", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const store = createSqliteMetaTokenStore(db, {
      encryptionKey: TEST_KEY,
    });

    store.upsertToken("meta-secret-token-12345");

    const row = db
      .prepare("SELECT token_vault FROM meta_tokens LIMIT 1")
      .get() as { token_vault: string };

    assert.notEqual(row.token_vault, "meta-secret-token-12345");
    assert.equal(store.getActiveToken(), "meta-secret-token-12345");
  } finally {
    db.close();
  }
});

test("bootstrap from env only when table empty", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const store = createSqliteMetaTokenStore(db, {
      encryptionKey: TEST_KEY,
    });

    bootstrapMetaTokenFromEnv(store, "env-meta-token");
    assert.equal(store.getActiveToken(), "env-meta-token");

    bootstrapMetaTokenFromEnv(store, "other-token");
    assert.equal(store.getActiveToken(), "env-meta-token");
  } finally {
    db.close();
  }
});
