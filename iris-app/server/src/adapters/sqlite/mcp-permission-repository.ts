import type { DatabaseSync } from "node:sqlite";
import type {
  McpPermissionSettings,
  McpPermissionStore,
} from "../../ports/mcp-permission-store.ts";

const PRIMARY_ID = "primary";

export function createSqliteMcpPermissionStore(
  db: DatabaseSync,
): McpPermissionStore {
  const selectOne = db.prepare(`
    SELECT preset, domain_overrides_json, updated_at
    FROM mcp_permission_settings
    WHERE id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO mcp_permission_settings (id, preset, domain_overrides_json, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      preset = excluded.preset,
      domain_overrides_json = excluded.domain_overrides_json,
      updated_at = excluded.updated_at
  `);

  function mapRow(row: {
    preset: string;
    domain_overrides_json: string | null;
    updated_at: string;
  }): McpPermissionSettings {
    return {
      preset: row.preset as McpPermissionSettings["preset"],
      domainOverridesJson: row.domain_overrides_json,
      updatedAt: row.updated_at,
    };
  }

  return {
    get() {
      const row = selectOne.get(PRIMARY_ID) as
        | {
            preset: string;
            domain_overrides_json: string | null;
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
      upsertStmt.run(
        PRIMARY_ID,
        input.preset,
        input.domainOverridesJson,
        updatedAt,
      );

      return mapRow(
        selectOne.get(PRIMARY_ID) as {
          preset: string;
          domain_overrides_json: string | null;
          updated_at: string;
        },
      );
    },
  };
}
