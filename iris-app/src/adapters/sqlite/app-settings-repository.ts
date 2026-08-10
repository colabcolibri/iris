import type { DatabaseSync } from "node:sqlite";
import type { AppSettings, AppSettingsStore } from "../../ports/app-settings-store.ts";
import { defaultAppSettings } from "../../domain/app-settings-defaults.ts";

const PRIMARY_ID = "primary";

type AppSettingsRow = {
  timezone: string;
  auto_reply_enabled: number;
  updated_at: string;
};

export function createSqliteAppSettingsStore(db: DatabaseSync): AppSettingsStore {
  const selectOne = db.prepare(`
    SELECT timezone, auto_reply_enabled, updated_at
    FROM app_settings
    WHERE id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO app_settings (id, timezone, auto_reply_enabled, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      timezone = excluded.timezone,
      auto_reply_enabled = excluded.auto_reply_enabled,
      updated_at = excluded.updated_at
  `);

  function mapRow(row: AppSettingsRow): AppSettings {
    return {
      timezone: row.timezone,
      autoReplyEnabled: row.auto_reply_enabled === 1,
      updatedAt: row.updated_at,
    };
  }

  return {
    get() {
      const row = selectOne.get(PRIMARY_ID) as AppSettingsRow | undefined;

      if (!row) {
        return null;
      }

      return mapRow(row);
    },

    upsert(input) {
      const updatedAt = input.updatedAt ?? new Date().toISOString();

      upsertStmt.run(
        PRIMARY_ID,
        input.timezone,
        input.autoReplyEnabled ? 1 : 0,
        updatedAt,
      );

      return mapRow(selectOne.get(PRIMARY_ID) as AppSettingsRow);
    },
  };
}

export function getAppSettingsOrDefault(store: AppSettingsStore): AppSettings {
  return store.get() ?? defaultAppSettings();
}
