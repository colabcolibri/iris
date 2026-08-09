import type { DatabaseSync } from "node:sqlite";
import type { AppSettings, AppSettingsStore } from "../../ports/app-settings-store.ts";
import { defaultAppSettings } from "../../domain/app-settings-defaults.ts";

const PRIMARY_ID = "primary";

export function createSqliteAppSettingsStore(db: DatabaseSync): AppSettingsStore {
  const selectOne = db.prepare(`
    SELECT timezone, updated_at
    FROM app_settings
    WHERE id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO app_settings (id, timezone, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      timezone = excluded.timezone,
      updated_at = excluded.updated_at
  `);

  function mapRow(row: { timezone: string; updated_at: string }): AppSettings {
    return {
      timezone: row.timezone,
      updatedAt: row.updated_at,
    };
  }

  return {
    get() {
      const row = selectOne.get(PRIMARY_ID) as
        | { timezone: string; updated_at: string }
        | undefined;

      if (!row) {
        return null;
      }

      return mapRow(row);
    },

    upsert(input) {
      const updatedAt = input.updatedAt ?? new Date().toISOString();

      upsertStmt.run(PRIMARY_ID, input.timezone, updatedAt);

      return mapRow(
        selectOne.get(PRIMARY_ID) as { timezone: string; updated_at: string },
      );
    },
  };
}

export function getAppSettingsOrDefault(store: AppSettingsStore): AppSettings {
  return store.get() ?? defaultAppSettings();
}
