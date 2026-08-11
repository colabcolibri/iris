import type { DatabaseSync } from "node:sqlite";
import type {
  MetaConnection,
  MetaConnectionStore,
} from "../../ports/meta-connection-store.ts";

const PRIMARY_ID = "primary";

export function createSqliteMetaConnectionStore(
  db: DatabaseSync,
): MetaConnectionStore {
  const selectOne = db.prepare(`
    SELECT ig_user_id, ig_username, page_id, page_name, connected_at, updated_at
    FROM meta_connection
    WHERE id = ?
  `);

  const upsert = db.prepare(`
    INSERT INTO meta_connection (
      id, ig_user_id, ig_username, page_id, page_name, connected_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      ig_user_id = excluded.ig_user_id,
      ig_username = excluded.ig_username,
      page_id = excluded.page_id,
      page_name = excluded.page_name,
      updated_at = excluded.updated_at
  `);

  const deleteAll = db.prepare("DELETE FROM meta_connection");

  return {
    get(): MetaConnection | null {
      const row = selectOne.get(PRIMARY_ID) as
        | {
            ig_user_id: string;
            ig_username: string | null;
            page_id: string;
            page_name: string | null;
            connected_at: string;
            updated_at: string;
          }
        | undefined;

      if (!row) {
        return null;
      }

      return {
        igUserId: row.ig_user_id,
        igUsername: row.ig_username,
        pageId: row.page_id,
        pageName: row.page_name,
        connectedAt: row.connected_at,
        updatedAt: row.updated_at,
      };
    },

    upsert(connection): MetaConnection {
      const now = new Date().toISOString();
      const existing = this.get();
      const connectedAt = connection.connectedAt ?? existing?.connectedAt ?? now;
      const updatedAt = connection.updatedAt ?? now;

      upsert.run(
        PRIMARY_ID,
        connection.igUserId,
        connection.igUsername,
        connection.pageId,
        connection.pageName,
        connectedAt,
        updatedAt,
      );

      return {
        igUserId: connection.igUserId,
        igUsername: connection.igUsername,
        pageId: connection.pageId,
        pageName: connection.pageName,
        connectedAt,
        updatedAt,
      };
    },

    clear(): void {
      deleteAll.run();
    },
  };
}
