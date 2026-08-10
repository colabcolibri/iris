import type { DatabaseSync } from "node:sqlite";
import type { AppSettings, AppSettingsStore } from "../../ports/app-settings-store.ts";
import { defaultAppSettings } from "../../domain/app-settings-defaults.ts";
import { autoReplyEnabledFromReplyMode, isReplyMode } from "../../domain/reply-mode.ts";

const PRIMARY_ID = "primary";

type AppSettingsRow = {
  timezone: string;
  auto_reply_enabled: number;
  reply_mode: string | null;
  updated_at: string;
};

function mapRow(row: AppSettingsRow): AppSettings {
  const replyMode = isReplyMode(row.reply_mode ?? "")
    ? row.reply_mode
    : row.auto_reply_enabled === 1
      ? "auto"
      : "off";

  return {
    timezone: row.timezone,
    replyMode,
    autoReplyEnabled: autoReplyEnabledFromReplyMode(replyMode),
    updatedAt: row.updated_at,
  };
}

export function createSqliteAppSettingsStore(db: DatabaseSync): AppSettingsStore {
  const selectOne = db.prepare(`
    SELECT timezone, auto_reply_enabled, reply_mode, updated_at
    FROM app_settings
    WHERE id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO app_settings (id, timezone, auto_reply_enabled, reply_mode, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      timezone = excluded.timezone,
      auto_reply_enabled = excluded.auto_reply_enabled,
      reply_mode = excluded.reply_mode,
      updated_at = excluded.updated_at
  `);

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
      const replyMode = input.replyMode;
      const autoReplyEnabled = autoReplyEnabledFromReplyMode(replyMode);

      upsertStmt.run(
        PRIMARY_ID,
        input.timezone,
        autoReplyEnabled ? 1 : 0,
        replyMode,
        updatedAt,
      );

      return mapRow(selectOne.get(PRIMARY_ID) as AppSettingsRow);
    },
  };
}

export function getAppSettingsOrDefault(store: AppSettingsStore): AppSettings {
  return store.get() ?? defaultAppSettings();
}
