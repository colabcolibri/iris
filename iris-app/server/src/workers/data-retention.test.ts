import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../adapters/sqlite/connection.ts";
import { runMigrations } from "../adapters/sqlite/migrate.ts";
import { createAppContext } from "../api/app-context.ts";
import { runDataRetention } from "./data-retention.ts";

test("runDataRetention deletes old webhook events only", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const ctx = createAppContext({
      db,
      adminToken: "admin",
      encryptionKey: "a".repeat(64),
      metaAccessToken: "meta",
    });

    ctx.webhookEvents.insert({
      payloadJson: '{"old":true}',
      signatureValid: true,
    });

    db.prepare(`UPDATE meta_webhook_events SET received_at = ?`).run(
      "2020-01-01T00:00:00.000Z",
    );

    const result = runDataRetention(ctx, 30);

    assert.equal(result.webhookEventsDeleted, 1);
    assert.equal(ctx.webhookEvents.count(), 0);
  } finally {
    db.close();
  }
});
