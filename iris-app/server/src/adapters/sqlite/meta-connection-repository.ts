import type { DatabaseSync } from "node:sqlite";
import {
  decryptToken,
  encryptToken,
  resolveEncryptionKey,
} from "../crypto/token-vault.ts";
import type {
  MetaConnection,
  MetaConnectionStore,
} from "../../ports/meta-connection-store.ts";

const PRIMARY_ID = "primary";

export type MetaConnectionRepositoryOptions = {
  encryptionKey?: string;
};

export function createSqliteMetaConnectionStore(
  db: DatabaseSync,
  options: MetaConnectionRepositoryOptions = {},
): MetaConnectionStore {
  const key = resolveEncryptionKey(options.encryptionKey);

  const selectOne = db.prepare(`
    SELECT ig_user_id, ig_username, page_id, page_name, page_access_token_vault,
           connected_at, updated_at
    FROM meta_connection
    WHERE id = ?
  `);

  const upsert = db.prepare(`
    INSERT INTO meta_connection (
      id, ig_user_id, ig_username, page_id, page_name, page_access_token_vault,
      connected_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      ig_user_id = excluded.ig_user_id,
      ig_username = excluded.ig_username,
      page_id = excluded.page_id,
      page_name = excluded.page_name,
      page_access_token_vault = COALESCE(excluded.page_access_token_vault, meta_connection.page_access_token_vault),
      updated_at = excluded.updated_at
  `);

  const updatePage = db.prepare(`
    UPDATE meta_connection
    SET page_id = ?, page_name = ?, page_access_token_vault = ?, updated_at = ?
    WHERE id = ?
  `);

  const deleteAll = db.prepare("DELETE FROM meta_connection");

  function mapRow(
    row: {
      ig_user_id: string;
      ig_username: string | null;
      page_id: string;
      page_name: string | null;
      page_access_token_vault: string | null;
      connected_at: string;
      updated_at: string;
    },
  ): MetaConnection {
    return {
      igUserId: row.ig_user_id,
      igUsername: row.ig_username,
      pageId: row.page_id,
      pageName: row.page_name,
      connectedAt: row.connected_at,
      updatedAt: row.updated_at,
      hasPageAccessToken: Boolean(row.page_access_token_vault),
    };
  }

  return {
    get(): MetaConnection | null {
      const row = selectOne.get(PRIMARY_ID) as
        | {
            ig_user_id: string;
            ig_username: string | null;
            page_id: string;
            page_name: string | null;
            page_access_token_vault: string | null;
            connected_at: string;
            updated_at: string;
          }
        | undefined;

      if (!row) {
        return null;
      }

      return mapRow(row);
    },

    upsert(connection): MetaConnection {
      const now = new Date().toISOString();
      const existing = this.get();
      const connectedAt = connection.connectedAt ?? existing?.connectedAt ?? now;
      const updatedAt = connection.updatedAt ?? now;
      const pageTokenVault =
        connection.pageAccessToken != null
          ? encryptToken(connection.pageAccessToken, key)
          : existing?.hasPageAccessToken
            ? (selectOne.get(PRIMARY_ID) as { page_access_token_vault: string | null })
                .page_access_token_vault
            : null;

      upsert.run(
        PRIMARY_ID,
        connection.igUserId,
        connection.igUsername,
        connection.pageId,
        connection.pageName,
        pageTokenVault,
        connectedAt,
        updatedAt,
      );

      return this.get()!;
    },

    upsertPageCredentials(input): MetaConnection | null {
      const existing = this.get();
      if (!existing) {
        return null;
      }

      const now = new Date().toISOString();
      const vault = encryptToken(input.pageAccessToken, key);
      updatePage.run(input.pageId, input.pageName, vault, now, PRIMARY_ID);

      return this.get();
    },

    getPageAccessToken(): string | null {
      const row = selectOne.get(PRIMARY_ID) as
        | { page_access_token_vault: string | null }
        | undefined;
      if (!row?.page_access_token_vault) {
        return null;
      }
      return decryptToken(row.page_access_token_vault, key);
    },

    clear(): void {
      deleteAll.run();
    },
  };
}
