import type { IncomingMessage, ServerResponse } from "node:http";
import type { AppContext } from "../app-context.ts";
import type { TenancyRuntime } from "../tenancy-runtime.ts";
import {
  BodyTooLargeError,
  readJsonBody,
  sendCodedError,
  sendError,
  sendJson,
  ValidationError,
} from "../json.ts";
import {
  AdminLoginError,
  confirmAdminLoginCode,
  requestAdminLoginCode,
} from "../../domain/auth/admin-login.ts";
import { signupAllows } from "../../domain/accounts/tenant-signup-policy.ts";
import {
  authIpRateLimiter,
  formatAuthIpRateLimitMessage,
  type AuthIpRateLimitAction,
} from "../../domain/auth/auth-ip-rate-limit.ts";
import { parseServerLocale } from "../../i18n/locale.ts";
import { resolveClientIp } from "../request-client-ip.ts";
import {
  appendSessionCookie,
  clearSessionCookie,
  createSessionToken,
  readSessionToken,
  verifySessionToken,
} from "../session.ts";

export async function handleAuthRoute(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
  pathname: string,
  tenancy?: TenancyRuntime | null,
): Promise<boolean> {
  if (!pathname.startsWith("/api/auth/")) {
    return false;
  }

  if (pathname === "/api/auth/request-code" && req.method === "POST") {
    if (!enforceAuthIpRateLimit(req, res, "request-code")) {
      return true;
    }

    try {
      const body = await readJsonBody<{ email?: unknown }>(req);
      const email = typeof body.email === "string" ? body.email : "";
      if (!email.trim()) {
        sendError(res, 422, "email is required");
        return true;
      }

      const locale = parseServerLocale(req.headers["x-iris-locale"]?.toString());
      const result = await requestAdminLoginCode(email, {
        challenges: tenancy?.challenges ?? ctx.adminLoginChallenges,
        emailSender: ctx.emailSender,
        locale,
        admit: (candidate) => signupAllowsEmail(candidate, tenancy),
      });
      sendJson(res, 200, result);
    } catch (error) {
      handleAuthError(res, error);
    }
    return true;
  }

  if (pathname === "/api/auth/confirm" && req.method === "POST") {
    if (!enforceAuthIpRateLimit(req, res, "confirm")) {
      return true;
    }

    try {
      const body = await readJsonBody<{ email?: unknown; code?: unknown }>(req);
      const email = typeof body.email === "string" ? body.email : "";
      const code = typeof body.code === "string" ? body.code : "";
      if (!email.trim() || !code.trim()) {
        sendError(res, 422, "email and code are required");
        return true;
      }

      const confirmed = await confirmAdminLoginCode(email, code, {
        challenges: tenancy?.challenges ?? ctx.adminLoginChallenges,
        emailSender: ctx.emailSender,
        admit: (candidate) => signupAllowsEmail(candidate, tenancy),
      });
      const account = await accountForConfirmedEmail(confirmed.email, tenancy);
      const token = createSessionToken(confirmed.email, account?.id);
      appendSessionCookie(res, token);
      sendJson(res, 200, { ok: true, slug: account?.slug ?? null });
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

  if (pathname === "/api/auth/me" && req.method === "GET") {
    const session = verifySessionToken(readSessionToken(req));
    if (!session.ok || !session.email) {
      sendError(res, 401, "not authenticated");
      return true;
    }

    const slug = session.accountId && tenancy
      ? tenancy.contextForAccount(session.accountId)?.accountSlug ?? null
      : null;
    sendJson(res, 200, {
      authenticated: true,
      email: session.email,
      ...(slug ? { slug } : {}),
    });
    return true;
  }

  sendError(res, 404, "Not found");
  return true;
}

function signupAllowsEmail(email: string, tenancy?: TenancyRuntime | null): boolean {
  return signupAllows({
    email,
    hasAccount: tenancy?.hasAccount(email) ?? false,
  });
}

async function accountForConfirmedEmail(email: string, tenancy?: TenancyRuntime | null) {
  if (!tenancy) {
    return null;
  }

  if (!signupAllowsEmail(email, tenancy)) {
    throw new AdminLoginError("code_invalid", "Código inválido.");
  }

  return tenancy.ensureAccount(email);
}

function enforceAuthIpRateLimit(
  req: IncomingMessage,
  res: ServerResponse,
  action: AuthIpRateLimitAction,
): boolean {
  const ip = resolveClientIp(req);
  const result = authIpRateLimiter.check(action, ip);
  if (result.allowed) {
    return true;
  }

  sendRateLimitError(
    res,
    result.retryAfterSeconds,
    formatAuthIpRateLimitMessage(result.retryAfterSeconds),
  );
  return false;
}

function sendRateLimitError(
  res: ServerResponse,
  retryAfterSeconds: number,
  message: string,
): void {
  res.writeHead(429, {
    "Content-Type": "application/json",
    "Retry-After": String(retryAfterSeconds),
  });
  res.end(JSON.stringify({ error: message }));
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
            : error.code === "security_not_configured"
              ? 503
            : error.code === "email_failed"
              ? 502
              : 401;
    sendError(res, status, error.message);
    return;
  }

  if (error instanceof ValidationError) {
    sendCodedError(res, 422, error.code, error.details);
    return;
  }

  if (error instanceof BodyTooLargeError) {
    sendCodedError(res, 413, error.code);
    return;
  }

  sendError(res, 500, "internal server error");
}
