import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { DATA_DIR, WORKSPACE_ROOT } from "../../paths.ts";

/**
 * Resolve SQLite path relative to `iris-app/` (workspace), never `process.cwd()`.
 * `pnpm --filter @iris/server` runs with cwd `server/`, so `./data/iris.db` would
 * otherwise open a second empty DB under `server/data/` and wipe persona/settings.
 */
export function resolveDatabasePath(dbPath?: string): string {
  const raw = dbPath ?? process.env.IRIS_DB_PATH;
  if (raw === ":memory:") {
    return raw;
  }
  if (!raw?.trim()) {
    return join(DATA_DIR, "iris.db");
  }
  const trimmed = raw.trim();
  if (isAbsolute(trimmed)) {
    return trimmed;
  }
  return resolve(WORKSPACE_ROOT, trimmed);
}

export function openDatabase(dbPath?: string): DatabaseSync {
  const path = resolveDatabasePath(dbPath);

  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }

  return new DatabaseSync(path);
}
