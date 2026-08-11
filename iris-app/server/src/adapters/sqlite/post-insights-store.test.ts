import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";
import { createSqlitePostInsightsStore } from "./post-insights-store.ts";

test("post insights store keeps history per post", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const store = createSqlitePostInsightsStore(db);

    db.prepare(
      `INSERT INTO posts (id, status, channel, caption, created_at, updated_at)
       VALUES ('post-1', 'published', 'instagram', 'cap', datetime('now'), datetime('now'))`,
    ).run();

    store.insert({
      postId: "post-1",
      igMediaId: "ig-1",
      metrics: [{ name: "reach", period: "lifetime", values: [{ value: 1 }] }],
      media: null,
      fetchedAt: "2026-08-11T10:00:00.000Z",
    });
    store.insert({
      postId: "post-1",
      igMediaId: "ig-1",
      metrics: [{ name: "reach", period: "lifetime", values: [{ value: 2 }] }],
      media: null,
      fetchedAt: "2026-08-11T11:00:00.000Z",
    });

    const latest = store.findLatestByPostId("post-1");
    assert.equal(latest?.metrics[0]?.values[0]?.value, 2);

    const history = store.listByPostId("post-1", 10);
    assert.equal(history.length, 2);
    assert.equal(history[0]?.metrics[0]?.values[0]?.value, 2);
  } finally {
    db.close();
  }
});
