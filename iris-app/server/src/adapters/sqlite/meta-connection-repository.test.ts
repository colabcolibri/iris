import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";
import { createSqliteMetaConnectionStore } from "./meta-connection-repository.ts";

test("meta connection store upserts single primary row", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const store = createSqliteMetaConnectionStore(db, {
      encryptionKey: "test-encryption-key-32chars-min!!",
    });

    const saved = store.upsert({
      igUserId: "ig-1",
      igUsername: "brand",
      pageId: "page-1",
      pageName: "Brand Page",
    });

    assert.equal(saved.igUserId, "ig-1");
    assert.equal(store.get()?.igUsername, "brand");
    assert.equal(store.get()?.hasPageAccessToken, false);

    store.upsert({
      igUserId: "ig-2",
      igUsername: "brand2",
      pageId: "page-2",
      pageName: "Other",
    });

    const row = db
      .prepare("SELECT COUNT(*) AS total FROM meta_connection")
      .get() as { total: number };
    assert.equal(row.total, 1);
    assert.equal(store.get()?.igUserId, "ig-2");
  } finally {
    db.close();
  }
});

test("meta connection store encrypts page access token", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const store = createSqliteMetaConnectionStore(db, {
      encryptionKey: "test-encryption-key-32chars-min!!",
    });

    store.upsert({
      igUserId: "ig-1",
      igUsername: "brand",
      pageId: "instagram-login",
      pageName: null,
    });

    const updated = store.upsertPageCredentials({
      pageId: "page-99",
      pageName: "Colibri",
      pageAccessToken: "page-token-secret",
    });

    assert.ok(updated);
    assert.equal(updated?.pageId, "page-99");
    assert.equal(updated?.hasPageAccessToken, true);
    assert.equal(store.getPageAccessToken(), "page-token-secret");

    const vaultRow = db
      .prepare(
        "SELECT page_access_token_vault FROM meta_connection WHERE id = 'primary'",
      )
      .get() as { page_access_token_vault: string };
    assert.notEqual(vaultRow.page_access_token_vault, "page-token-secret");
  } finally {
    db.close();
  }
});
