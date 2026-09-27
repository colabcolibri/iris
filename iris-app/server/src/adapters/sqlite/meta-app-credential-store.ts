import type { DatabaseSync } from "node:sqlite";
import {
  decryptToken,
  encryptToken,
  resolveEncryptionKey,
} from "../crypto/token-vault.ts";

const PRIMARY_ID = "primary";

export type MetaAppCredentialSecrets = {
  appId: string;
  appSecret: string;
  verifyToken: string;
};

export type MetaAppCredentialPublic = {
  appId: string;
  hasSecret: boolean;
  hasVerifyToken: boolean;
};

export function createMetaAppCredentialStore(db: DatabaseSync, encryptionKey?: string) {
  const key = resolveEncryptionKey(encryptionKey);
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta_app_credentials (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      app_secret_vault TEXT NOT NULL,
      verify_token_vault TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  const selectOne = db.prepare(`
    SELECT app_id, app_secret_vault, verify_token_vault
    FROM meta_app_credentials
    WHERE id = ?
  `);
  const upsert = db.prepare(`
    INSERT INTO meta_app_credentials (id, app_id, app_secret_vault, verify_token_vault, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      app_id = excluded.app_id,
      app_secret_vault = excluded.app_secret_vault,
      verify_token_vault = excluded.verify_token_vault,
      updated_at = excluded.updated_at
  `);

  function readRow(): {
    app_id: string;
    app_secret_vault: string;
    verify_token_vault: string;
  } | undefined {
    return selectOne.get(PRIMARY_ID) as
      | { app_id: string; app_secret_vault: string; verify_token_vault: string }
      | undefined;
  }

  return {
    getPublic(): MetaAppCredentialPublic | null {
      const row = readRow();
      if (!row) {
        return null;
      }
      return {
        appId: row.app_id,
        hasSecret: Boolean(row.app_secret_vault),
        hasVerifyToken: Boolean(row.verify_token_vault),
      };
    },
    getSecrets(): MetaAppCredentialSecrets | null {
      const row = readRow();
      if (!row?.app_secret_vault) {
        return null;
      }
      return {
        appId: row.app_id,
        appSecret: decryptToken(row.app_secret_vault, key),
        verifyToken: row.verify_token_vault ? decryptToken(row.verify_token_vault, key) : "",
      };
    },
    save(input: { appId: string; appSecret: string; verifyToken: string }): void {
      upsert.run(
        PRIMARY_ID,
        input.appId.trim(),
        encryptToken(input.appSecret, key),
        encryptToken(input.verifyToken, key),
        new Date().toISOString(),
      );
    },
  };
}

export type MetaAppCredentialStore = ReturnType<typeof createMetaAppCredentialStore>;
