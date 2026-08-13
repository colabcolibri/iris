import type { IncomingMessage, ServerResponse } from "node:http";
import type { AppContext } from "../app-context.ts";
import {
  BodyTooLargeError,
  readJsonBody,
  sendCodedError,
  sendError,
  sendJson,
  ValidationError,
} from "../json.ts";
import {
  ContactFormError,
  submitContactForm,
} from "../../domain/contact/contact-form.ts";
import { contactIpRateLimiter } from "../../domain/contact/contact-rate-limit.ts";
import { ErrorCodes } from "../../domain/errors/error-codes.ts";
import { parseServerLocale } from "../../i18n/locale.ts";
import { resolveClientIp } from "../request-client-ip.ts";

export async function handleContactRoute(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
  pathname: string,
): Promise<boolean> {
  if (pathname !== "/api/contact" || req.method !== "POST") {
    return false;
  }

  const ip = resolveClientIp(req);
  const rateLimit = contactIpRateLimiter.check(ip);
  if (!rateLimit.allowed) {
    res.writeHead(429, {
      "Content-Type": "application/json",
      "Retry-After": String(rateLimit.retryAfterSeconds),
    });
    res.end(
      JSON.stringify({
        error: {
          code: ErrorCodes.RATE_LIMITED,
          details: { retryAfterSeconds: rateLimit.retryAfterSeconds },
        },
      }),
    );
    return true;
  }

  try {
    const body = await readJsonBody<{
      name?: unknown;
      email?: unknown;
      subject?: unknown;
      message?: unknown;
      pageUrl?: unknown;
      website?: unknown;
      locale?: unknown;
    }>(req);

    const locale = parseServerLocale(
      typeof body.locale === "string" ? body.locale : undefined,
    );

    const result = await submitContactForm(
      {
        name: typeof body.name === "string" ? body.name : "",
        email: typeof body.email === "string" ? body.email : "",
        subject: typeof body.subject === "string" ? body.subject : "",
        message: typeof body.message === "string" ? body.message : "",
        pageUrl: typeof body.pageUrl === "string" ? body.pageUrl : undefined,
        website: typeof body.website === "string" ? body.website : undefined,
        locale,
      },
      { emailSender: ctx.emailSender, locale },
    );

    sendJson(res, 200, result);
  } catch (error) {
    handleContactError(res, error);
  }

  return true;
}

function handleContactError(res: ServerResponse, error: unknown): void {
  if (error instanceof ContactFormError) {
    if (
      error.code === "email_not_configured" ||
      error.code === "email_failed"
    ) {
      const status = error.code === "email_not_configured" ? 503 : 502;
      sendError(res, status, error.message);
      return;
    }

    sendCodedError(res, 422, error.apiCode, error.details);
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
