import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import {
  decryptToken,
  encryptToken,
  resolveEncryptionKey,
} from "../crypto/token-vault.ts";
import type { MetaTokenStore } from "../../ports/meta-token-store.ts";

export type MetaTokenRepositoryOptions = {
  encryptionKey?: string;
};

export function createSqliteMetaTokenStore(
  db: DatabaseSync,
  options: MetaTokenRepositoryOptions = {},
): MetaTokenStore {
  const key = resolveEncryptionKey(options.encryptionKey);

  const selectLatest = db.prepare(`
    SELECT token_vault FROM meta_tokens
    ORDER BY updated_at DESC
    LIMIT 1
  `);

  const upsert = db.prepare(`
    INSERT INTO meta_tokens (id, token_vault, expires_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      token_vault = excluded.token_vault,
      expires_at = excluded.expires_at,
      updated_at = excluded.updated_at
  `);

  const deleteAll = db.prepare("DELETE FROM meta_tokens");

  return {
    getActiveToken() {
      const row = selectLatest.get() as { token_vault: string } | undefined;
      if (!row) {
        return null;
      }

      return decryptToken(row.token_vault, key);
    },

    upsertToken(plain, expiresAt = null) {
      const now = new Date().toISOString();
      const vault = encryptToken(plain, key);

      deleteAll.run();
      upsert.run(randomUUID(), vault, expiresAt, now);
    },

    clear() {
      deleteAll.run();
    },
  };
}

export function bootstrapMetaTokenFromEnv(
  store: MetaTokenStore,
  envToken?: string,
): void {
  if (!envToken || store.getActiveToken()) {
    return;
  }

  store.upsertToken(envToken);
}
