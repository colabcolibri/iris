import { ValidationError } from "../../api/json.ts";
import type { AppSettings } from "../../ports/app-settings-store.ts";
import { isValidReplyDelaySeconds } from "../comments/compute-agent-reply-not-before.ts";
import {
  autoReplyEnabledFromReplyMode,
  isReplyMode,
  replyModeFromAutoReplyEnabled,
} from "../posts/reply-mode.ts";
import { isValidIanaTimeZone } from "../time/timezone.ts";
import {
  isValidAutoMonitorIntervalSeconds,
  normalizeAutoMonitorIntervalSeconds,
} from "./auto-monitor-settings.ts";

export function serializeAppSettings(settings: AppSettings) {
  return {
    timezone: settings.timezone,
    reply_mode: settings.replyMode,
    auto_reply_enabled: settings.autoReplyEnabled,
    reply_delay_seconds: settings.replyDelaySeconds,
    message_reply_mode: settings.messageReplyMode,
    message_auto_reply_enabled: settings.messageAutoReplyEnabled,
    message_reply_delay_seconds: settings.messageReplyDelaySeconds,
    auto_monitor_enabled: settings.autoMonitorEnabled,
    auto_monitor_interval_seconds: settings.autoMonitorIntervalSeconds,
    updated_at: settings.updatedAt,
  };
}

export function serializeAppSettingsMcp(settings: AppSettings) {
  const { updated_at: _updatedAt, ...fields } = serializeAppSettings(settings);
  return fields;
}

export function normalizeAppSettingsBody(
  body: Record<string, unknown>,
  current: AppSettings,
): Omit<AppSettings, "updatedAt"> {
  const hasTimezone = "timezone" in body;
  const hasAutoReply = "auto_reply_enabled" in body;
  const hasReplyMode = "reply_mode" in body;
  const hasReplyDelay = "reply_delay_seconds" in body;
  const hasMessageAutoReply = "message_auto_reply_enabled" in body;
  const hasMessageReplyMode = "message_reply_mode" in body;
  const hasMessageReplyDelay = "message_reply_delay_seconds" in body;
  const hasAutoMonitor = "auto_monitor_enabled" in body;
  const hasAutoMonitorInterval = "auto_monitor_interval_seconds" in body;

  if (
    !hasTimezone &&
    !hasAutoReply &&
    !hasReplyMode &&
    !hasReplyDelay &&
    !hasMessageAutoReply &&
    !hasMessageReplyMode &&
    !hasMessageReplyDelay &&
    !hasAutoMonitor &&
    !hasAutoMonitorInterval
  ) {
    throw new ValidationError(
      "at least one of timezone, reply_mode, reply_delay_seconds, auto_reply_enabled, message_reply_mode, message_reply_delay_seconds, message_auto_reply_enabled, auto_monitor_enabled, or auto_monitor_interval_seconds is required",
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

  let messageReplyMode = current.messageReplyMode;
  if (hasMessageReplyMode) {
    if (typeof body.message_reply_mode !== "string" || !isReplyMode(body.message_reply_mode)) {
      throw new ValidationError("message_reply_mode must be off, auto, or draft");
    }
    messageReplyMode = body.message_reply_mode;
  } else if (hasMessageAutoReply) {
    if (typeof body.message_auto_reply_enabled !== "boolean") {
      throw new ValidationError("message_auto_reply_enabled must be a boolean");
    }
    messageReplyMode = replyModeFromAutoReplyEnabled(body.message_auto_reply_enabled);
  }

  let messageReplyDelaySeconds = current.messageReplyDelaySeconds;
  if (hasMessageReplyDelay) {
    if (typeof body.message_reply_delay_seconds !== "number") {
      throw new ValidationError("message_reply_delay_seconds must be a number");
    }
    if (!isValidReplyDelaySeconds(body.message_reply_delay_seconds)) {
      throw new ValidationError(
        "message_reply_delay_seconds must be 0 (immediate) or between 30 and 600",
      );
    }
    messageReplyDelaySeconds = Math.round(body.message_reply_delay_seconds);
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
    messageReplyMode,
    messageAutoReplyEnabled: autoReplyEnabledFromReplyMode(messageReplyMode),
    messageReplyDelaySeconds,
    autoMonitorEnabled,
    autoMonitorIntervalSeconds,
  };
}
