import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { DatabaseSync } from "node:sqlite";

const MIGRATIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../migrations",
);

function ensureMigrationsTable(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
}

function listPendingMigrations(db: DatabaseSync): string[] {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const applied = new Set(
    db
      .prepare("SELECT version FROM schema_migrations")
      .all()
      .map((row) => (row as { version: string }).version),
  );

  return files.filter((file) => !applied.has(file.replace(/\.sql$/, "")));
}

export function runMigrations(db: DatabaseSync): string[] {
  ensureMigrationsTable(db);

  const appliedNow: string[] = [];

  for (const file of listPendingMigrations(db)) {
    const version = file.replace(/\.sql$/, "");
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");

    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.prepare(
        "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
      ).run(version, new Date().toISOString());
      db.exec("COMMIT");
      appliedNow.push(version);
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  return appliedNow;
}

export function countAppliedMigrations(db: DatabaseSync): number {
  ensureMigrationsTable(db);
  const row = db
    .prepare("SELECT COUNT(*) AS total FROM schema_migrations")
    .get() as { total: number };
  return row.total;
}

export function migrationsDirectory(): string {
  return MIGRATIONS_DIR;
}
