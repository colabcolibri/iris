import type { IncomingMessage, ServerResponse } from "node:http";
import type { AppContext } from "../app-context.ts";
import {
  BodyTooLargeError,
  readJsonBody,
  sendError,
  sendJson,
  ValidationError,
} from "../json.ts";
import {
  AdminLoginError,
  confirmAdminLoginCode,
  requestAdminLoginCode,
} from "../../domain/admin-login.ts";
import {
  appendSessionCookie,
  clearSessionCookie,
  createSessionToken,
} from "../session.ts";

export async function handleAuthRoute(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
  pathname: string,
): Promise<boolean> {
  if (!pathname.startsWith("/api/auth/")) {
    return false;
  }

  if (pathname === "/api/auth/request-code" && req.method === "POST") {
    try {
      const body = await readJsonBody<{ email?: unknown }>(req);
      const email = typeof body.email === "string" ? body.email : "";
      if (!email.trim()) {
        sendError(res, 422, "email is required");
        return true;
      }

      const result = await requestAdminLoginCode(email, {
        challenges: ctx.adminLoginChallenges,
        emailSender: ctx.emailSender,
      });
      sendJson(res, 200, result);
    } catch (error) {
      handleAuthError(res, error);
    }
    return true;
  }

  if (pathname === "/api/auth/confirm" && req.method === "POST") {
    try {
      const body = await readJsonBody<{ email?: unknown; code?: unknown }>(req);
      const email = typeof body.email === "string" ? body.email : "";
      const code = typeof body.code === "string" ? body.code : "";
      if (!email.trim() || !code.trim()) {
        sendError(res, 422, "email and code are required");
        return true;
      }

      const confirmed = await confirmAdminLoginCode(email, code, {
        challenges: ctx.adminLoginChallenges,
        emailSender: ctx.emailSender,
      });
      const token = createSessionToken(confirmed.email);
      appendSessionCookie(res, token);
      sendJson(res, 200, { ok: true });
    } catch (error) {
      handleAuthError(res, error);
    }
    return true;
  }

  if (pathname === "/api/auth/logout" && req.method === "POST") {
    clearSessionCookie(res);
    sendJson(res, 200, { ok: true });
    return true;
  }

  sendError(res, 404, "Not found");
  return true;
}

function handleAuthError(res: ServerResponse, error: unknown): void {
  if (error instanceof AdminLoginError) {
    const status =
      error.code === "rate_limited"
        ? 429
        : error.code === "too_many_attempts"
          ? 429
          : error.code === "email_not_configured"
            ? 503
            : error.code === "email_failed"
              ? 502
              : 401;
    sendError(res, status, error.message);
    return;
  }

  if (error instanceof ValidationError) {
    sendError(res, 422, error.message);
    return;
  }

  if (error instanceof BodyTooLargeError) {
    sendError(res, 413, error.message);
    return;
  }

  sendError(res, 500, "internal server error");
}
