import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";
import { createSqliteSimulatorScenarioStore } from "./simulator-scenario-repository.ts";

test("simulator scenario store seeds editorial scenarios", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const store = createSqliteSimulatorScenarioStore(db);
    const items = store.list();

    assert.ok(items.length >= 2);
    assert.ok(items.some((item) => item.id === "lookbook-verao"));
    assert.ok(items.some((item) => item.id === "reel-styling"));

    const scenario = store.getById("lookbook-verao");
    assert.ok(scenario);
    assert.equal(scenario!.targetAuthor, "julia.style");
    assert.equal(scenario!.thread.length, 2);
  } finally {
    db.close();
  }
});

test("simulator scenario store supports CRUD", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const store = createSqliteSimulatorScenarioStore(db);

    const created = store.create({
      id: "custom-scenario",
      label: "Custom",
      description: "Custom description",
      caption: "Custom caption",
      carouselSummary: "Custom carousel",
      thread: [{ author: "user", text: "Hi" }],
      targetAuthor: "guest",
      targetText: "Question?",
    });

    assert.equal(created.id, "custom-scenario");
    assert.equal(store.getById("custom-scenario")?.label, "Custom");

    const updated = store.update("custom-scenario", {
      ...created,
      label: "Custom updated",
    });
    assert.equal(updated?.label, "Custom updated");

    assert.equal(store.delete("custom-scenario"), true);
    assert.equal(store.getById("custom-scenario"), null);
    assert.equal(store.delete("custom-scenario"), false);
  } finally {
    db.close();
  }
});

test("simulator scenario store rejects duplicate ids", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const store = createSqliteSimulatorScenarioStore(db);

    assert.throws(
      () =>
        store.create({
          id: "lookbook-verao",
          label: "Duplicate",
          description: "desc",
          caption: "caption",
          carouselSummary: "carousel",
          thread: [],
          targetAuthor: "user",
          targetText: "text",
        }),
      /already exists/,
    );
  } finally {
    db.close();
  }
});
