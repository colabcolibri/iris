import type { DatabaseSync } from "node:sqlite";
import type { AppSettings, AppSettingsStore } from "../../ports/app-settings-store.ts";
import { defaultAppSettings } from "../../domain/settings/app-settings-defaults.ts";
import { autoReplyEnabledFromReplyMode, isReplyMode } from "../../domain/posts/reply-mode.ts";
import {
  AGENT_REPLY_TICK_INTERVAL_DEFAULT_SECONDS,
  normalizeAgentReplyTickIntervalSeconds,
} from "../../domain/settings/agent-reply-tick-settings.ts";
import {
  AUTO_MONITOR_INTERVAL_DEFAULT_SECONDS,
  normalizeAutoMonitorIntervalSeconds,
} from "../../domain/settings/auto-monitor-settings.ts";
import {
  REPLY_MAX_AGE_DAYS_DEFAULT,
  normalizeReplyMaxAgeDays,
} from "../../domain/settings/reply-max-age-settings.ts";
import { parseServerLocale } from "../../i18n/locale.ts";

const PRIMARY_ID = "primary";

type AppSettingsRow = {
  timezone: string;
  admin_locale: string | null;
  auto_reply_enabled: number;
  reply_mode: string | null;
  reply_delay_seconds: number;
  reply_max_age_days: number | null;
  private_reply_mode: string | null;
  message_auto_reply_enabled: number | null;
  message_reply_mode: string | null;
  message_reply_delay_seconds: number | null;
  agent_reply_tick_interval_seconds: number | null;
  auto_monitor_enabled: number | null;
  auto_monitor_interval_seconds: number | null;
  updated_at: string;
};

function mapRow(row: AppSettingsRow): AppSettings {
  const replyMode = isReplyMode(row.reply_mode ?? "")
    ? row.reply_mode
    : row.auto_reply_enabled === 1
      ? "auto"
      : "off";

  const privateReplyMode = isReplyMode(row.private_reply_mode ?? "")
    ? row.private_reply_mode
    : "off";

  const messageReplyMode = isReplyMode(row.message_reply_mode ?? "")
    ? row.message_reply_mode
    : Number(row.message_auto_reply_enabled ?? 0) === 1
      ? "auto"
      : "draft";

  const intervalRaw = Number(
    row.auto_monitor_interval_seconds ?? AUTO_MONITOR_INTERVAL_DEFAULT_SECONDS,
  );
  const tickIntervalRaw = Number(
    row.agent_reply_tick_interval_seconds ?? AGENT_REPLY_TICK_INTERVAL_DEFAULT_SECONDS,
  );

  return {
    timezone: row.timezone,
    adminLocale: parseServerLocale(row.admin_locale),
    replyMode,
    autoReplyEnabled: autoReplyEnabledFromReplyMode(replyMode),
    replyDelaySeconds: Number(row.reply_delay_seconds ?? 0),
    replyMaxAgeDays: normalizeReplyMaxAgeDays(
      Number(row.reply_max_age_days ?? REPLY_MAX_AGE_DAYS_DEFAULT),
    ),
    privateReplyMode,
    messageReplyMode,
    messageAutoReplyEnabled: autoReplyEnabledFromReplyMode(messageReplyMode),
    messageReplyDelaySeconds: Number(row.message_reply_delay_seconds ?? 0),
    agentReplyTickIntervalSeconds: normalizeAgentReplyTickIntervalSeconds(
      Number.isFinite(tickIntervalRaw)
        ? tickIntervalRaw
        : AGENT_REPLY_TICK_INTERVAL_DEFAULT_SECONDS,
    ),
    autoMonitorEnabled: Number(row.auto_monitor_enabled ?? 1) === 1,
    autoMonitorIntervalSeconds: normalizeAutoMonitorIntervalSeconds(
      Number.isFinite(intervalRaw) ? intervalRaw : AUTO_MONITOR_INTERVAL_DEFAULT_SECONDS,
    ),
    updatedAt: row.updated_at,
  };
}

export function createSqliteAppSettingsStore(db: DatabaseSync): AppSettingsStore {
  const selectOne = db.prepare(`
    SELECT
      timezone,
      admin_locale,
      auto_reply_enabled,
      reply_mode,
      reply_delay_seconds,
      reply_max_age_days,
      private_reply_mode,
      message_auto_reply_enabled,
      message_reply_mode,
      message_reply_delay_seconds,
      agent_reply_tick_interval_seconds,
      auto_monitor_enabled,
      auto_monitor_interval_seconds,
      updated_at
    FROM app_settings
    WHERE id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO app_settings (
      id,
      timezone,
      admin_locale,
      auto_reply_enabled,
      reply_mode,
      reply_delay_seconds,
      reply_max_age_days,
      private_reply_mode,
      message_auto_reply_enabled,
      message_reply_mode,
      message_reply_delay_seconds,
      agent_reply_tick_interval_seconds,
      auto_monitor_enabled,
      auto_monitor_interval_seconds,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      timezone = excluded.timezone,
      admin_locale = excluded.admin_locale,
      auto_reply_enabled = excluded.auto_reply_enabled,
      reply_mode = excluded.reply_mode,
      reply_delay_seconds = excluded.reply_delay_seconds,
      reply_max_age_days = excluded.reply_max_age_days,
      private_reply_mode = excluded.private_reply_mode,
      message_auto_reply_enabled = excluded.message_auto_reply_enabled,
      message_reply_mode = excluded.message_reply_mode,
      message_reply_delay_seconds = excluded.message_reply_delay_seconds,
      agent_reply_tick_interval_seconds = excluded.agent_reply_tick_interval_seconds,
      auto_monitor_enabled = excluded.auto_monitor_enabled,
      auto_monitor_interval_seconds = excluded.auto_monitor_interval_seconds,
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
      const previous = selectOne.get(PRIMARY_ID) as AppSettingsRow | undefined;
      const current = previous ? mapRow(previous) : defaultAppSettings();
      const merged = {
        ...current,
        ...input,
      };
      const updatedAt = merged.updatedAt ?? new Date().toISOString();
      const replyMode = merged.replyMode;
      const autoReplyEnabled = autoReplyEnabledFromReplyMode(replyMode);
      const messageReplyMode = merged.messageReplyMode;
      const messageAutoReplyEnabled = autoReplyEnabledFromReplyMode(messageReplyMode);
      const privateReplyMode = merged.privateReplyMode;

      upsertStmt.run(
        PRIMARY_ID,
        merged.timezone,
        merged.adminLocale,
        autoReplyEnabled ? 1 : 0,
        replyMode,
        merged.replyDelaySeconds,
        normalizeReplyMaxAgeDays(merged.replyMaxAgeDays),
        privateReplyMode,
        messageAutoReplyEnabled ? 1 : 0,
        messageReplyMode,
        merged.messageReplyDelaySeconds,
        normalizeAgentReplyTickIntervalSeconds(merged.agentReplyTickIntervalSeconds),
        merged.autoMonitorEnabled ? 1 : 0,
        normalizeAutoMonitorIntervalSeconds(merged.autoMonitorIntervalSeconds),
        updatedAt,
      );

      return mapRow(selectOne.get(PRIMARY_ID) as AppSettingsRow);
    },
  };
}

export function getAppSettingsOrDefault(store: AppSettingsStore): AppSettings {
  return store.get() ?? defaultAppSettings();
}
