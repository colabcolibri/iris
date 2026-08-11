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
  ContactFormError,
  submitContactForm,
} from "../../domain/contact-form.ts";
import {
  contactIpRateLimiter,
  formatContactIpRateLimitMessage,
} from "../../domain/contact-rate-limit.ts";
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
        error: formatContactIpRateLimitMessage(rateLimit.retryAfterSeconds),
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
    }>(req);

    const result = await submitContactForm(
      {
        name: typeof body.name === "string" ? body.name : "",
        email: typeof body.email === "string" ? body.email : "",
        subject: typeof body.subject === "string" ? body.subject : "",
        message: typeof body.message === "string" ? body.message : "",
        pageUrl: typeof body.pageUrl === "string" ? body.pageUrl : undefined,
        website: typeof body.website === "string" ? body.website : undefined,
      },
      { emailSender: ctx.emailSender },
    );

    sendJson(res, 200, result);
  } catch (error) {
    handleContactError(res, error);
  }

  return true;
}

function handleContactError(res: ServerResponse, error: unknown): void {
  if (error instanceof ContactFormError) {
    const status =
      error.code === "email_not_configured"
        ? 503
        : error.code === "email_failed"
          ? 502
          : 400;
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
