import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";

test("runMigrations creates posts and post_assets without legacy columns", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);

    const postColumns = db
      .prepare("PRAGMA table_info(posts)")
      .all()
      .map((row) => (row as { name: string }).name);

    assert.ok(postColumns.includes("channel"));
    assert.ok(postColumns.includes("source_note"));
    assert.equal(postColumns.includes("deck_ref"), false);
    assert.equal(postColumns.includes("media_urls"), false);

    const assetColumns = db
      .prepare("PRAGMA table_info(post_assets)")
      .all()
      .map((row) => (row as { name: string }).name);

    assert.ok(assetColumns.includes("storage_path"));
    assert.ok(assetColumns.includes("sort_order"));
    assert.ok(assetColumns.includes("mime"));
    assert.ok(assetColumns.includes("optimized_size_bytes"));

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      )
      .all()
      .map((row) => (row as { name: string }).name);

    for (const table of [
      "posts",
      "post_assets",
      "comments",
      "comment_replies",
      "conversations",
      "messages",
      "message_replies",
      "products",
      "agent_runs",
      "api_keys",
      "meta_tokens",
      "meta_connection",
      "reply_persona",
      "app_settings",
      "mcp_connection_settings",
      "meta_webhook_events",
      "llm_settings",
      "admin_login_challenges",
      "schema_migrations",
    ]) {
      assert.ok(tables.includes(table), `missing table ${table}`);
    }
  } finally {
    db.close();
  }
});

test("runMigrations is idempotent", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    runMigrations(db);

    const count = db
      .prepare("SELECT COUNT(*) AS total FROM schema_migrations")
      .get() as { total: number };

  assert.equal(count.total, 57);
  } finally {
    db.close();
  }
});
