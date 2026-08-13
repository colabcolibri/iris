import {
  getDomainMessages,
  interpolate,
  type I18nDomainId,
} from "@/i18n/compose";
import type { AppLocale } from "@/i18n/types";

export type ApiErrorPayload = {
  code: string;
  details?: Record<string, unknown>;
  legacyMessage?: string;
};

export class ApiRequestError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly status: number;

  constructor(
    code: string,
    status: number,
    details?: Record<string, unknown>,
    legacyMessage?: string,
  ) {
    super(legacyMessage ?? code);
    this.name = "ApiRequestError";
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export function parseApiErrorPayload(
  payload: unknown,
  status: number,
): ApiErrorPayload {
  if (!payload || typeof payload !== "object") {
    return { code: "REQUEST_FAILED", details: { status: String(status) } };
  }

  const record = payload as Record<string, unknown>;
  const errorField = record.error;

  if (typeof errorField === "string") {
    return {
      code: "LEGACY_MESSAGE",
      legacyMessage: errorField,
      details: { status: String(status) },
    };
  }

  if (errorField && typeof errorField === "object") {
    const err = errorField as Record<string, unknown>;
    const code =
      typeof err.code === "string" ? err.code : "VALIDATION_FAILED";
    const details =
      err.details && typeof err.details === "object"
        ? (err.details as Record<string, unknown>)
        : undefined;
    return { code, details };
  }

  return { code: "REQUEST_FAILED", details: { status: String(status) } };
}

export function translateApiError(
  code: string,
  locale: AppLocale,
  params?: Record<string, string | number>,
  legacyMessage?: string,
): string {
  const messages = getDomainMessages("serverErrors", locale);
  const template =
    (messages as Record<string, string>)[code] ??
    messages.REQUEST_FAILED;

  const detailMessage =
    typeof params?.message === "string" && params.message.trim()
      ? params.message.trim()
      : undefined;
  const fallbackMessage =
    legacyMessage && legacyMessage !== code ? legacyMessage : undefined;

  const merged: Record<string, string | number> = {
    ...params,
    message: detailMessage ?? fallbackMessage ?? code,
  };

  return interpolate(template, merged);
}

export function getApiErrorMessage(
  error: unknown,
  locale: AppLocale,
): string {
  if (error instanceof ApiRequestError) {
    const detailMessage =
      typeof error.details?.message === "string"
        ? error.details.message
        : undefined;

    return translateApiError(
      error.code,
      locale,
      {
        status: String(error.status),
        ...(error.details as Record<string, string | number> | undefined),
      },
      detailMessage,
    );
  }

  if (error instanceof Error) {
    return translateApiError("LEGACY_MESSAGE", locale, {
      message: error.message,
    });
  }

  return translateApiError("INTERNAL_ERROR", locale);
}

export function translateDomain<D extends I18nDomainId>(
  domain: D,
  locale: AppLocale,
  path: string,
  params?: Record<string, string | number>,
): string {
  const messages = getDomainMessages(domain, locale) as Record<string, unknown>;
  const parts = path.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (!current || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current !== "string") return path;
  return params ? interpolate(current, params) : current;
}
