import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";
import { createSqliteMetaConnectionStore } from "./meta-connection-repository.ts";

test("meta connection store upserts single primary row", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const store = createSqliteMetaConnectionStore(db);

    const saved = store.upsert({
      igUserId: "ig-1",
      igUsername: "brand",
      pageId: "page-1",
      pageName: "Brand Page",
    });

    assert.equal(saved.igUserId, "ig-1");
    assert.equal(store.get()?.igUsername, "brand");

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
