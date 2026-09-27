import type { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { DATA_DIR } from "../../paths.ts";
import { openDatabase } from "./connection.ts";

const CONTROL_SCHEMA = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS account_databases (
  account_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  auth_token_vault TEXT,
  migration_version TEXT,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS admin_login_challenges (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  last_request_at TEXT NOT NULL
);
`;

export function controlDatabasePath(): string {
  return join(DATA_DIR, "control.db");
}

export function openControlDatabase(dbPath?: string): DatabaseSync {
  const db = openDatabase(dbPath ?? controlDatabasePath());
  db.exec(CONTROL_SCHEMA);
  return db;
}

export function controlHasEditorialTables(db: DatabaseSync): boolean {
  const row = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'posts'",
    )
    .get() as { name: string } | undefined;
  return Boolean(row);
}
