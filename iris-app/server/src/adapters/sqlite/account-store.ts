import type { DatabaseSync } from "node:sqlite";
import {
  decryptToken,
  encryptToken,
  resolveEncryptionKey,
} from "../crypto/token-vault.ts";

export type AccountRecord = {
  id: string;
  email: string;
  slug: string;
  status: "pending" | "active";
  databaseUrl: string | null;
  databaseName: string | null;
  authToken: string | null;
  migrationVersion: string | null;
};

type AccountRow = {
  id: string;
  email: string;
  slug: string;
  status: string;
  url: string | null;
  name: string | null;
  auth_token_vault: string | null;
  migration_version: string | null;
};

export function createAccountStore(
  db: DatabaseSync,
  encryptionKey?: string,
) {
  const key = resolveEncryptionKey(encryptionKey);

  const selectByEmail = db.prepare(`
    SELECT a.id, a.email, a.slug, a.status, d.url, d.name, d.auth_token_vault, d.migration_version
    FROM accounts a
    LEFT JOIN account_databases d ON d.account_id = a.id
    WHERE a.email = ?
  `);
  const selectById = db.prepare(`
    SELECT a.id, a.email, a.slug, a.status, d.url, d.name, d.auth_token_vault, d.migration_version
    FROM accounts a
    LEFT JOIN account_databases d ON d.account_id = a.id
    WHERE a.id = ?
  `);
  const selectActive = db.prepare(`
    SELECT a.id, a.email, a.slug, a.status, d.url, d.name, d.auth_token_vault, d.migration_version
    FROM accounts a
    LEFT JOIN account_databases d ON d.account_id = a.id
    WHERE a.status = 'active' AND d.url IS NOT NULL
    ORDER BY a.created_at
  `);
  const insertAccount = db.prepare(`
    INSERT INTO accounts (id, email, slug, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const updateStatus = db.prepare(`
    UPDATE accounts SET status = ?, updated_at = ? WHERE id = ?
  `);
  const upsertDatabase = db.prepare(`
    INSERT INTO account_databases (account_id, name, url, auth_token_vault, migration_version)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(account_id) DO UPDATE SET
      name = excluded.name,
      url = excluded.url,
      auth_token_vault = excluded.auth_token_vault,
      migration_version = excluded.migration_version
  `);
  const updateVersion = db.prepare(`
    UPDATE account_databases SET migration_version = ? WHERE account_id = ?
  `);

  function map(row: AccountRow | undefined): AccountRecord | null {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      email: row.email,
      slug: row.slug,
      status: row.status === "active" ? "active" : "pending",
      databaseUrl: row.url,
      databaseName: row.name,
      authToken: row.auth_token_vault ? decryptToken(row.auth_token_vault, key) : null,
      migrationVersion: row.migration_version,
    };
  }

  return {
    findByEmail(email: string): AccountRecord | null {
      return map(selectByEmail.get(email) as AccountRow | undefined);
    },
    findById(id: string): AccountRecord | null {
      return map(selectById.get(id) as AccountRow | undefined);
    },
    listActive(): AccountRecord[] {
      return (selectActive.all() as AccountRow[])
        .map((row) => map(row))
        .filter((row): row is AccountRecord => row !== null);
    },
    insertPending(input: { id: string; email: string; slug: string; now: string }): void {
      insertAccount.run(input.id, input.email, input.slug, "pending", input.now, input.now);
    },
    markActive(id: string, now: string): void {
      updateStatus.run("active", now, id);
    },
    saveDatabase(input: {
      accountId: string;
      name: string;
      url: string;
      authToken: string | null;
      migrationVersion: string | null;
    }): void {
      const vault = input.authToken ? encryptToken(input.authToken, key) : null;
      upsertDatabase.run(
        input.accountId,
        input.name,
        input.url,
        vault,
        input.migrationVersion,
      );
    },
    saveMigrationVersion(accountId: string, version: string): void {
      updateVersion.run(version, accountId);
    },
  };
}

export type AccountStore = ReturnType<typeof createAccountStore>;
