import { resolveTimeZone } from "../time/timezone.ts";
import type { AppSettings } from "../../ports/app-settings-store.ts";
import type { ServerAppLocale } from "../../i18n/locale.ts";
import { AUTO_MONITOR_INTERVAL_DEFAULT_SECONDS } from "./auto-monitor-settings.ts";
import { AGENT_REPLY_TICK_INTERVAL_DEFAULT_SECONDS } from "./agent-reply-tick-settings.ts";
import { REPLY_MAX_AGE_DAYS_DEFAULT } from "./reply-max-age-settings.ts";

export function defaultAppSettings(): AppSettings {
  return {
    timezone: resolveTimeZone(null),
    adminLocale: "pt",
    replyMode: "auto",
    autoReplyEnabled: true,
    replyDelaySeconds: 0,
    replyMaxAgeDays: REPLY_MAX_AGE_DAYS_DEFAULT,
    messageReplyMode: "draft",
    messageAutoReplyEnabled: false,
    messageReplyDelaySeconds: 0,
    agentReplyTickIntervalSeconds: AGENT_REPLY_TICK_INTERVAL_DEFAULT_SECONDS,
    autoMonitorEnabled: true,
    autoMonitorIntervalSeconds: AUTO_MONITOR_INTERVAL_DEFAULT_SECONDS,
    updatedAt: new Date().toISOString(),
  };
}
