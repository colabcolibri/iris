import { readJsonBody, sendJson } from "../json.ts";
import { createAdminPathRouter } from "../router.ts";
import { defaultAppSettings } from "../../domain/settings/app-settings-defaults.ts";
import {
  normalizeAppSettingsBody,
  serializeAppSettings,
} from "../../domain/settings/app-settings-mutations.ts";

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
