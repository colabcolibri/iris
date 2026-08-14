import { ValidationError } from "../../api/json.ts";
import type { AppSettings } from "../../ports/app-settings-store.ts";
import { parseServerLocale } from "../../i18n/locale.ts";
import { isValidReplyDelaySeconds } from "../comments/compute-agent-reply-not-before.ts";
import {
  autoReplyEnabledFromReplyMode,
  isReplyMode,
  replyModeFromAutoReplyEnabled,
} from "../posts/reply-mode.ts";
import { isValidIanaTimeZone } from "../time/timezone.ts";
import {
  isValidAgentReplyTickIntervalSeconds,
  normalizeAgentReplyTickIntervalSeconds,
} from "./agent-reply-tick-settings.ts";
import {
  isValidAutoMonitorIntervalSeconds,
  normalizeAutoMonitorIntervalSeconds,
} from "./auto-monitor-settings.ts";
import {
  isValidReplyMaxAgeDays,
  normalizeReplyMaxAgeDays,
} from "./reply-max-age-settings.ts";

export function serializeAppSettings(settings: AppSettings) {
  return {
    timezone: settings.timezone,
    admin_locale: settings.adminLocale,
    reply_mode: settings.replyMode,
    auto_reply_enabled: settings.autoReplyEnabled,
    reply_delay_seconds: settings.replyDelaySeconds,
    reply_max_age_days: settings.replyMaxAgeDays,
    message_reply_mode: settings.messageReplyMode,
    message_auto_reply_enabled: settings.messageAutoReplyEnabled,
    message_reply_delay_seconds: settings.messageReplyDelaySeconds,
    agent_reply_tick_interval_seconds: settings.agentReplyTickIntervalSeconds,
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
  const hasReplyMaxAgeDays = "reply_max_age_days" in body;
  const hasMessageAutoReply = "message_auto_reply_enabled" in body;
  const hasMessageReplyMode = "message_reply_mode" in body;
  const hasMessageReplyDelay = "message_reply_delay_seconds" in body;
  const hasAgentReplyTickInterval = "agent_reply_tick_interval_seconds" in body;
  const hasAutoMonitor = "auto_monitor_enabled" in body;
  const hasAutoMonitorInterval = "auto_monitor_interval_seconds" in body;
  const hasAdminLocale = "admin_locale" in body;

  if (
    !hasTimezone &&
    !hasAutoReply &&
    !hasReplyMode &&
    !hasReplyDelay &&
    !hasReplyMaxAgeDays &&
    !hasMessageAutoReply &&
    !hasMessageReplyMode &&
    !hasMessageReplyDelay &&
    !hasAgentReplyTickInterval &&
    !hasAutoMonitor &&
    !hasAutoMonitorInterval &&
    !hasAdminLocale
  ) {
    throw new ValidationError(
      "at least one of timezone, admin_locale, reply_mode, reply_delay_seconds, reply_max_age_days, agent_reply_tick_interval_seconds, auto_reply_enabled, message_reply_mode, message_reply_delay_seconds, message_auto_reply_enabled, auto_monitor_enabled, or auto_monitor_interval_seconds is required",
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
        "reply_delay_seconds must be 0 (immediate) or between 60 and 3600",
      );
    }
    replyDelaySeconds = Math.round(body.reply_delay_seconds);
  }

  let replyMaxAgeDays = current.replyMaxAgeDays;
  if (hasReplyMaxAgeDays) {
    if (typeof body.reply_max_age_days !== "number") {
      throw new ValidationError("reply_max_age_days must be a number");
    }
    if (!isValidReplyMaxAgeDays(body.reply_max_age_days)) {
      throw new ValidationError("reply_max_age_days must be between 1 and 365");
    }
    replyMaxAgeDays = normalizeReplyMaxAgeDays(body.reply_max_age_days);
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
        "message_reply_delay_seconds must be 0 (immediate) or between 60 and 3600",
      );
    }
    messageReplyDelaySeconds = Math.round(body.message_reply_delay_seconds);
  }

  let agentReplyTickIntervalSeconds = current.agentReplyTickIntervalSeconds;
  if (hasAgentReplyTickInterval) {
    if (typeof body.agent_reply_tick_interval_seconds !== "number") {
      throw new ValidationError("agent_reply_tick_interval_seconds must be a number");
    }
    if (!isValidAgentReplyTickIntervalSeconds(body.agent_reply_tick_interval_seconds)) {
      throw new ValidationError(
        "agent_reply_tick_interval_seconds must be one of 180, 300, 600, 900, or 1200",
      );
    }
    agentReplyTickIntervalSeconds = normalizeAgentReplyTickIntervalSeconds(
      body.agent_reply_tick_interval_seconds,
    );
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

  let adminLocale = current.adminLocale;
  if (hasAdminLocale) {
    if (typeof body.admin_locale !== "string") {
      throw new ValidationError("admin_locale must be a string");
    }
    adminLocale = parseServerLocale(body.admin_locale);
  }

  return {
    timezone,
    adminLocale,
    replyMode,
    autoReplyEnabled: autoReplyEnabledFromReplyMode(replyMode),
    replyDelaySeconds,
    replyMaxAgeDays,
    messageReplyMode,
    messageAutoReplyEnabled: autoReplyEnabledFromReplyMode(messageReplyMode),
    messageReplyDelaySeconds,
    agentReplyTickIntervalSeconds,
    autoMonitorEnabled,
    autoMonitorIntervalSeconds,
  };
}
