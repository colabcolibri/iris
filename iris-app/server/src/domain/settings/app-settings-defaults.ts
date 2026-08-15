import { resolveTimeZone } from "../time/timezone.ts";
import type { AppSettings } from "../../ports/app-settings-store.ts";
import type { ServerAppLocale } from "../../i18n/locale.ts";
import { AUTO_MONITOR_INTERVAL_DEFAULT_SECONDS } from "./auto-monitor-settings.ts";
import { AGENT_REPLY_TICK_INTERVAL_DEFAULT_SECONDS } from "./agent-reply-tick-settings.ts";
import { REPLY_MAX_AGE_DAYS_DEFAULT } from "./reply-max-age-settings.ts";
import { AGENT_REPLY_DEBOUNCE_DEFAULT_SECONDS } from "../agent-reply/agent-reply-debounce.ts";

export function defaultAppSettings(): AppSettings {
  return {
    timezone: resolveTimeZone(null),
    adminLocale: "pt",
    replyMode: "auto",
    autoReplyEnabled: true,
    replyDelaySeconds: AGENT_REPLY_DEBOUNCE_DEFAULT_SECONDS,
    replyMaxAgeDays: REPLY_MAX_AGE_DAYS_DEFAULT,
    privateReplyMode: "off",
    messageReplyMode: "draft",
    messageAutoReplyEnabled: false,
    messageReplyDelaySeconds: AGENT_REPLY_DEBOUNCE_DEFAULT_SECONDS,
    agentReplyTickIntervalSeconds: AGENT_REPLY_TICK_INTERVAL_DEFAULT_SECONDS,
    autoMonitorEnabled: true,
    autoMonitorIntervalSeconds: AUTO_MONITOR_INTERVAL_DEFAULT_SECONDS,
    updatedAt: new Date().toISOString(),
  };
}
