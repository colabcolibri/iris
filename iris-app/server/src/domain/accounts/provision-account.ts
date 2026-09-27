import { randomBytes, randomUUID } from "node:crypto";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { DATA_DIR } from "../../paths.ts";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import type { AccountStore } from "../../adapters/sqlite/account-store.ts";
import { openAccountDatabase } from "../../adapters/sqlite/open-account-database.ts";

export type ProvisionedDatabase = {
  name: string;
  url: string;
  authToken: string | null;
  migrationVersion: string;
};

export type AccountDatabaseProvisioner = {
  create(accountId: string): Promise<ProvisionedDatabase>;
};

export function latestMigrationVersion(db: DatabaseSync): string {
  const row = db
    .prepare("SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1")
    .get() as { version: string } | undefined;
  return row?.version ?? "";
}

export function createLocalProvisioner(dataRoot: string = DATA_DIR): AccountDatabaseProvisioner {
  return {
    async create(accountId: string) {
      const path = join(dataRoot, "tenants", accountId, "iris.db");
      const db = openDatabase(path);
      try {
        runMigrations(db);
        return {
          name: `local-${accountId}`,
          url: `file:${path}`,
          authToken: null,
          migrationVersion: latestMigrationVersion(db),
        };
      } finally {
        db.close();
      }
    },
  };
}

export function createSlug(): string {
  return randomBytes(6).toString("hex");
}

export async function ensureAccountDatabase(input: {
  store: AccountStore;
  email: string;
  provisioner: AccountDatabaseProvisioner;
}): Promise<{ id: string; slug: string; email: string }> {
  const email = input.email.trim().toLowerCase();
  const existing = input.store.findByEmail(email);
  if (existing?.status === "active" && existing.databaseUrl) {
    return { id: existing.id, slug: existing.slug, email: existing.email };
  }

  const id = existing?.id ?? randomUUID();
  const slug = existing?.slug ?? createSlug();
  const now = new Date().toISOString();
  if (!existing) {
    input.store.insertPending({ id, email, slug, now });
  }

  const created = await input.provisioner.create(id);
  input.store.saveDatabase({
    accountId: id,
    name: created.name,
    url: created.url,
    authToken: created.authToken,
    migrationVersion: created.migrationVersion,
  });
  input.store.markActive(id, now);
  return { id, slug, email };
}

export function openStoredAccountDatabase(
  url: string,
  authToken: string | null,
): DatabaseSync {
  return openAccountDatabase(url, authToken);
}

export function applyMigrationsToAccount(db: DatabaseSync): string {
  runMigrations(db);
  return latestMigrationVersion(db);
}
