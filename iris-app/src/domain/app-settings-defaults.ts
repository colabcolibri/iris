import { resolveTimeZone } from "./timezone.ts";
import type { AppSettings } from "../ports/app-settings-store.ts";

export function defaultAppSettings(): AppSettings {
  return {
    timezone: resolveTimeZone(null),
    updatedAt: new Date().toISOString(),
  };
}
