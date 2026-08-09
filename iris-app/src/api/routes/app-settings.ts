import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthContext } from "../auth.ts";
import { requireAdmin } from "../auth.ts";
import type { AppContext } from "../app-context.ts";
import {
  BodyTooLargeError,
  readJsonBody,
  sendError,
  sendJson,
  ValidationError,
} from "../json.ts";
import { defaultAppSettings } from "../../domain/app-settings-defaults.ts";
import { isValidIanaTimeZone } from "../../domain/timezone.ts";
import type { AppSettings } from "../../ports/app-settings-store.ts";

type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
};

function serializeAppSettings(settings: AppSettings) {
  return {
    timezone: settings.timezone,
    updated_at: settings.updatedAt,
  };
}

function normalizeAppSettingsBody(body: Record<string, unknown>) {
  const timezone =
    typeof body.timezone === "string" ? body.timezone.trim() : "";

  if (!timezone) {
    throw new ValidationError("timezone is required");
  }

  if (!isValidIanaTimeZone(timezone)) {
    throw new ValidationError("timezone must be a valid IANA time zone");
  }

  return { timezone };
}

export async function handleAppSettingsRoute(request: RouteRequest): Promise<boolean> {
  const { req, res, ctx, auth } = request;
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  if (pathname !== "/api/settings/app") {
    return false;
  }

  if (!requireAdmin(auth)) {
    sendError(res, 403, "admin token required");
    return true;
  }

  if (req.method === "GET") {
    const settings = ctx.appSettingsStore.get() ?? defaultAppSettings();
    sendJson(res, 200, serializeAppSettings(settings));
    return true;
  }

  if (req.method === "PUT") {
    try {
      const body = await readJsonBody<Record<string, unknown>>(req);
      const input = normalizeAppSettingsBody(body);
      const saved = ctx.appSettingsStore.upsert(input);
      sendJson(res, 200, serializeAppSettings(saved));
    } catch (error) {
      if (error instanceof ValidationError) {
        sendError(res, 422, error.message);
        return true;
      }
      if (error instanceof BodyTooLargeError) {
        sendError(res, 413, error.message);
        return true;
      }
      sendError(res, 500, "internal server error");
    }
    return true;
  }

  sendError(res, 405, "method not allowed");
  return true;
}
