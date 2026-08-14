import type { DatabaseSync } from "node:sqlite";
import {
  defaultOperatorNotificationSettings,
  type OperatorNotificationSettingsStore,
} from "../../domain/notifications/operator-notification-service.ts";
import type {
  OperatorNotificationChannelConfig,
  OperatorNotificationSettings,
} from "../../domain/notifications/operator-notification-types.ts";

const PRIMARY_ID = "primary";

type SettingsRow = {
  channels_json: string;
  updated_at: string;
};

function parseChannelConfig(value: unknown): OperatorNotificationChannelConfig {
  if (!value || typeof value !== "object") {
    return { enabled: false, destination: "" };
  }
  const record = value as Record<string, unknown>;
  return {
    enabled: record.enabled === true,
    destination: typeof record.destination === "string" ? record.destination.trim() : "",
  };
}

function parseSettings(row: SettingsRow): OperatorNotificationSettings {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(row.channels_json) as Record<string, unknown>;
  } catch {
    parsed = {};
  }

  const aiLockDays =
    typeof parsed.ai_lock_days === "number" && Number.isInteger(parsed.ai_lock_days)
      ? parsed.ai_lock_days
      : 5;

  return {
    channels: {
      email: parseChannelConfig(parsed.email),
    },
    aiLockDays,
    updatedAt: row.updated_at,
  };
}

export function createSqliteOperatorNotificationSettingsStore(
  db: DatabaseSync,
): OperatorNotificationSettingsStore {
  const selectStmt = db.prepare(`
    SELECT channels_json, updated_at
    FROM operator_notification_settings
    WHERE id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO operator_notification_settings (id, channels_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      channels_json = excluded.channels_json,
      updated_at = excluded.updated_at
  `);

  return {
    get() {
      const row = selectStmt.get(PRIMARY_ID) as SettingsRow | undefined;
      if (!row) {
        return null;
      }
      return parseSettings(row);
    },
    upsert(input) {
      const updatedAt = input.updatedAt ?? new Date().toISOString();
      const channelsJson = JSON.stringify({
        email: input.channels.email,
        ai_lock_days: input.aiLockDays,
      });
      upsertStmt.run(PRIMARY_ID, channelsJson, updatedAt);
      return {
        channels: input.channels,
        aiLockDays: input.aiLockDays,
        updatedAt,
      };
    },
  };
}

export function getOperatorNotificationSettingsOrDefault(
  store: OperatorNotificationSettingsStore,
): OperatorNotificationSettings {
  return store.get() ?? defaultOperatorNotificationSettings();
}
