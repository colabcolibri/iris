import type { DatabaseSync } from "node:sqlite";
import type {
  McpConnectionSettings,
  McpConnectionStore,
} from "../../ports/mcp-connection-store.ts";

const PRIMARY_ID = "primary";

export function createSqliteMcpConnectionStore(db: DatabaseSync): McpConnectionStore {
  const selectOne = db.prepare(`
    SELECT code_hash, code_hint, updated_at
    FROM mcp_connection_settings
    WHERE id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO mcp_connection_settings (id, code_hash, code_hint, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      code_hash = excluded.code_hash,
      code_hint = excluded.code_hint,
      updated_at = excluded.updated_at
  `);

  const deleteStmt = db.prepare(`
    DELETE FROM mcp_connection_settings WHERE id = ?
  `);

  function mapRow(row: {
    code_hash: string;
    code_hint: string;
    updated_at: string;
  }): McpConnectionSettings {
    return {
      codeHash: row.code_hash,
      codeHint: row.code_hint,
      updatedAt: row.updated_at,
    };
  }

  return {
    get() {
      const row = selectOne.get(PRIMARY_ID) as
        | {
            code_hash: string;
            code_hint: string;
            updated_at: string;
          }
        | undefined;

      if (!row) {
        return null;
      }

      return mapRow(row);
    },

    upsert(input) {
      const updatedAt = new Date().toISOString();

      upsertStmt.run(PRIMARY_ID, input.codeHash, input.codeHint, updatedAt);

      return mapRow(
        selectOne.get(PRIMARY_ID) as {
          code_hash: string;
          code_hint: string;
          updated_at: string;
        },
      );
    },

    clear() {
      deleteStmt.run(PRIMARY_ID);
    },
  };
}
