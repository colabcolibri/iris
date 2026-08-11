import { resolveTimeZone } from "../time/timezone.ts";
import type { AppSettings } from "../../ports/app-settings-store.ts";
import { AUTO_MONITOR_INTERVAL_DEFAULT_SECONDS } from "./auto-monitor-settings.ts";

export function defaultAppSettings(): AppSettings {
  return {
    timezone: resolveTimeZone(null),
    replyMode: "auto",
    autoReplyEnabled: true,
    replyDelaySeconds: 0,
    autoMonitorEnabled: true,
    autoMonitorIntervalSeconds: AUTO_MONITOR_INTERVAL_DEFAULT_SECONDS,
    updatedAt: new Date().toISOString(),
  };
}
