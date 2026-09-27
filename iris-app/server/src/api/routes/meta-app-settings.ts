import type { IncomingMessage, ServerResponse } from "node:http";
import type { AppContext } from "../app-context.ts";
import { readJsonBody, sendError, sendJson } from "../json.ts";

export async function handleMetaAppSettingsRoute(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
  pathname: string,
): Promise<boolean> {
  if (pathname !== "/api/settings/meta-app") {
    return false;
  }

  if (req.method === "GET") {
    const current = ctx.metaAppCredentials.getPublic();
    sendJson(res, 200, {
      app_id: current?.appId ?? "",
      has_secret: current?.hasSecret ?? false,
      has_verify_token: current?.hasVerifyToken ?? false,
    });
    return true;
  }

  if (req.method === "PUT") {
    const body = await readJsonBody<{
      app_id?: unknown;
      app_secret?: unknown;
      verify_token?: unknown;
    }>(req);
    const appId = typeof body.app_id === "string" ? body.app_id.trim() : "";
    const appSecret = typeof body.app_secret === "string" ? body.app_secret : "";
    const verifyToken = typeof body.verify_token === "string" ? body.verify_token : "";
    if (!appId || !appSecret || !verifyToken) {
      sendError(res, 422, "app_id, app_secret and verify_token are required");
      return true;
    }
    ctx.metaAppCredentials.save({ appId, appSecret, verifyToken });
    sendJson(res, 200, { app_id: appId, has_secret: true, has_verify_token: true });
    return true;
  }

  sendError(res, 405, "method not allowed");
  return true;
}
