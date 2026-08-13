import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  CreateStoreConnectionInput,
  StoreConnectionRecord,
  StoreConnectionRepository,
  UpdateStoreConnectionInput,
} from "../../ports/store-connection-repository.ts";
import type { StoreCredentials } from "../../domain/stores/store-types.ts";
import { createStoreCredentialVault } from "../../domain/stores/store-credential-vault.ts";
import { mapStoreConnectionRow } from "./store-mappers.ts";

export function createSqliteStoreConnectionRepository(
  db: DatabaseSync,
  options?: { encryptionKey?: string },
): StoreConnectionRepository {
  const vault = createStoreCredentialVault(options);

  const listStmt = db.prepare(`
    SELECT id, provider_type, label, status, settings_json, encrypted_credentials,
           last_sync_at, last_error, created_at, updated_at
    FROM store_connections
    ORDER BY label ASC
  `);

  const selectById = db.prepare(`
    SELECT id, provider_type, label, status, settings_json, encrypted_credentials,
           last_sync_at, last_error, created_at, updated_at
    FROM store_connections
    WHERE id = ?
  `);

  const insert = db.prepare(`
    INSERT INTO store_connections (
      id, provider_type, label, status, settings_json, encrypted_credentials,
      last_sync_at, last_error, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateStmt = db.prepare(`
    UPDATE store_connections
    SET label = COALESCE(?, label),
        status = COALESCE(?, status),
        settings_json = COALESCE(?, settings_json),
        encrypted_credentials = COALESCE(?, encrypted_credentials),
        last_sync_at = ?,
        last_error = ?,
        updated_at = ?
    WHERE id = ?
  `);

  const removeStmt = db.prepare(`DELETE FROM store_connections WHERE id = ?`);

  function nowIso(): string {
    return new Date().toISOString();
  }

  function readRow(id: string): StoreConnectionRecord | null {
    const row = selectById.get(id);
    return row ? mapStoreConnectionRow(row as never) : null;
  }

  return {
    list() {
      const rows = listStmt.all() as never[];
      return rows.map((row) => mapStoreConnectionRow(row));
    },

    findById(id) {
      return readRow(id);
    },

    getCredentials(id) {
      const row = selectById.get(id) as { encrypted_credentials: string | null } | undefined;
      if (!row?.encrypted_credentials) {
        return null;
      }
      return vault.decrypt(row.encrypted_credentials);
    },

    create(input: CreateStoreConnectionInput) {
      const id = randomUUID();
      const ts = nowIso();
      const encrypted = vault.encrypt(input.credentials);

      insert.run(
        id,
        input.providerType,
        input.label.trim(),
        input.status ?? "active",
        JSON.stringify(input.settings ?? {}),
        encrypted,
        null,
        null,
        ts,
        ts,
      );

      return readRow(id)!;
    },

    update(id, input: UpdateStoreConnectionInput) {
      const existing = selectById.get(id) as
        | {
            settings_json: string;
            encrypted_credentials: string | null;
            last_sync_at: string | null;
            last_error: string | null;
          }
        | undefined;

      if (!existing) {
        return null;
      }

      const encrypted =
        input.credentials !== undefined
          ? vault.encrypt(input.credentials)
          : existing.encrypted_credentials;

      const lastSyncAt =
        input.lastSyncAt !== undefined ? input.lastSyncAt : existing.last_sync_at;
      const lastError =
        input.lastError !== undefined ? input.lastError : existing.last_error;

      updateStmt.run(
        input.label?.trim() ?? null,
        input.status ?? null,
        input.settings !== undefined ? JSON.stringify(input.settings) : null,
        encrypted,
        lastSyncAt,
        lastError,
        nowIso(),
        id,
      );

      return readRow(id);
    },

    remove(id) {
      const result = removeStmt.run(id);
      return result.changes > 0;
    },
  };
}
