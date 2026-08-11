import { readJsonBody, sendJson, ValidationError } from "../json.ts";
import { createAdminPathRouter } from "../router.ts";
import { defaultAppSettings } from "../../domain/settings/app-settings-defaults.ts";
import { isValidIanaTimeZone } from "../../domain/time/timezone.ts";
import type { AppSettings } from "../../ports/app-settings-store.ts";
import {
  autoReplyEnabledFromReplyMode,
  isReplyMode,
  replyModeFromAutoReplyEnabled,
} from "../../domain/posts/reply-mode.ts";
import { isValidReplyDelaySeconds } from "../../domain/comments/compute-agent-reply-not-before.ts";
import {
  isValidAutoMonitorIntervalSeconds,
  normalizeAutoMonitorIntervalSeconds,
} from "../../domain/settings/auto-monitor-settings.ts";

function serializeAppSettings(settings: AppSettings) {
  return {
    timezone: settings.timezone,
    reply_mode: settings.replyMode,
    auto_reply_enabled: settings.autoReplyEnabled,
    reply_delay_seconds: settings.replyDelaySeconds,
    auto_monitor_enabled: settings.autoMonitorEnabled,
    auto_monitor_interval_seconds: settings.autoMonitorIntervalSeconds,
    updated_at: settings.updatedAt,
  };
}

function normalizeAppSettingsBody(
  body: Record<string, unknown>,
  current: AppSettings,
): Omit<AppSettings, "updatedAt"> {
  const hasTimezone = "timezone" in body;
  const hasAutoReply = "auto_reply_enabled" in body;
  const hasReplyMode = "reply_mode" in body;
  const hasReplyDelay = "reply_delay_seconds" in body;
  const hasAutoMonitor = "auto_monitor_enabled" in body;
  const hasAutoMonitorInterval = "auto_monitor_interval_seconds" in body;

  if (
    !hasTimezone &&
    !hasAutoReply &&
    !hasReplyMode &&
    !hasReplyDelay &&
    !hasAutoMonitor &&
    !hasAutoMonitorInterval
  ) {
    throw new ValidationError(
      "at least one of timezone, reply_mode, reply_delay_seconds, auto_reply_enabled, auto_monitor_enabled, or auto_monitor_interval_seconds is required",
    );
  }

  let timezone = current.timezone;
  if (hasTimezone) {
    timezone = typeof body.timezone === "string" ? body.timezone.trim() : "";
    if (!timezone) {
      throw new ValidationError("timezone is required");
    }
    if (!isValidIanaTimeZone(timezone)) {
      throw new ValidationError("timezone must be a valid IANA time zone");
    }
  }

  let replyMode = current.replyMode;
  if (hasReplyMode) {
    if (typeof body.reply_mode !== "string" || !isReplyMode(body.reply_mode)) {
      throw new ValidationError("reply_mode must be off, auto, or draft");
    }
    replyMode = body.reply_mode;
  } else if (hasAutoReply) {
    if (typeof body.auto_reply_enabled !== "boolean") {
      throw new ValidationError("auto_reply_enabled must be a boolean");
    }
    replyMode = replyModeFromAutoReplyEnabled(body.auto_reply_enabled);
  }

  let replyDelaySeconds = current.replyDelaySeconds;
  if (hasReplyDelay) {
    if (typeof body.reply_delay_seconds !== "number") {
      throw new ValidationError("reply_delay_seconds must be a number");
    }
    if (!isValidReplyDelaySeconds(body.reply_delay_seconds)) {
      throw new ValidationError(
        "reply_delay_seconds must be 0 (immediate) or between 30 and 600",
      );
    }
    replyDelaySeconds = Math.round(body.reply_delay_seconds);
  }

  let autoMonitorEnabled = current.autoMonitorEnabled;
  if (hasAutoMonitor) {
    if (typeof body.auto_monitor_enabled !== "boolean") {
      throw new ValidationError("auto_monitor_enabled must be a boolean");
    }
    autoMonitorEnabled = body.auto_monitor_enabled;
  }

  let autoMonitorIntervalSeconds = current.autoMonitorIntervalSeconds;
  if (hasAutoMonitorInterval) {
    if (typeof body.auto_monitor_interval_seconds !== "number") {
      throw new ValidationError("auto_monitor_interval_seconds must be a number");
    }
    if (!isValidAutoMonitorIntervalSeconds(body.auto_monitor_interval_seconds)) {
      throw new ValidationError(
        "auto_monitor_interval_seconds must be between 60 and 3600",
      );
    }
    autoMonitorIntervalSeconds = normalizeAutoMonitorIntervalSeconds(
      body.auto_monitor_interval_seconds,
    );
  }

  return {
    timezone,
    replyMode,
    autoReplyEnabled: autoReplyEnabledFromReplyMode(replyMode),
    replyDelaySeconds,
    autoMonitorEnabled,
    autoMonitorIntervalSeconds,
  };
}

export const handleAppSettingsRoute = createAdminPathRouter("/api/settings/app", {
  GET: async (match) => {
    const settings = match.ctx.appSettingsStore.get() ?? defaultAppSettings();
    sendJson(match.res, 200, serializeAppSettings(settings));
  },
  PUT: async (match) => {
    const body = await readJsonBody<Record<string, unknown>>(match.req);
    const current = match.ctx.appSettingsStore.get() ?? defaultAppSettings();
    const input = normalizeAppSettingsBody(body, current);
    const saved = match.ctx.appSettingsStore.upsert(input);
    sendJson(match.res, 200, serializeAppSettings(saved));
  },
});
