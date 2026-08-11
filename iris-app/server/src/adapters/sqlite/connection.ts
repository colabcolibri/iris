import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export function openDatabase(dbPath?: string): DatabaseSync {
  const path = dbPath ?? process.env.IRIS_DB_PATH ?? "./data/iris.db";

  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }

  return new DatabaseSync(path);
}
