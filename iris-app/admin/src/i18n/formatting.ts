import type { AppLocale } from "@/i18n/types";
import { localeToBcp47 } from "@/i18n/types";

export function formatRelativeTime(
  value: string | number | Date | null | undefined,
  locale: AppLocale,
  now = Date.now(),
): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const ms =
    typeof value === "number"
      ? value
      : value instanceof Date
        ? value.getTime()
        : Date.parse(value);

  if (Number.isNaN(ms)) {
    return null;
  }

  const diffSec = Math.max(0, Math.floor((now - ms) / 1000));
  const bcp47 = localeToBcp47(locale);
  const rtf = new Intl.RelativeTimeFormat(bcp47, { numeric: "auto" });

  if (diffSec < 10) {
    return locale === "en" ? "just now" : "agora";
  }
  if (diffSec < 60) {
    return rtf.format(-diffSec, "second");
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return rtf.format(-diffMin, "minute");
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return rtf.format(-diffHour, "hour");
  }

  const diffDay = Math.floor(diffHour / 24);
  return rtf.format(-diffDay, "day");
}

export function formatCountdownTo(
  value: string | number | Date | null | undefined,
  locale: AppLocale,
  now = Date.now(),
): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const ms =
    typeof value === "number"
      ? value
      : value instanceof Date
        ? value.getTime()
        : Date.parse(value);

  if (Number.isNaN(ms)) {
    return null;
  }

  const diffSec = Math.ceil((ms - now) / 1000);
  if (diffSec <= 0) {
    return locale === "en" ? "now" : "agora";
  }

  const bcp47 = localeToBcp47(locale);
  const rtf = new Intl.RelativeTimeFormat(bcp47, { numeric: "auto" });

  if (diffSec < 60) {
    return rtf.format(diffSec, "second");
  }

  const diffMin = Math.ceil(diffSec / 60);
  if (diffMin < 60) {
    return rtf.format(diffMin, "minute");
  }

  const diffHour = Math.ceil(diffMin / 60);
  if (diffHour < 24) {
    return rtf.format(diffHour, "hour");
  }

  const diffDay = Math.ceil(diffHour / 24);
  return rtf.format(diffDay, "day");
}

export function formatShortDate(
  value: string | number | Date,
  locale: AppLocale,
): string {
  const ms =
    typeof value === "number"
      ? value
      : value instanceof Date
        ? value.getTime()
        : Date.parse(value);
  return new Intl.DateTimeFormat(localeToBcp47(locale), {
    day: "2-digit",
    month: "short",
  }).format(ms);
}

export function formatDateTime(
  value: string | number | Date,
  locale: AppLocale,
): string {
  const ms =
    typeof value === "number"
      ? value
      : value instanceof Date
        ? value.getTime()
        : Date.parse(value);
  return new Intl.DateTimeFormat(localeToBcp47(locale), {
    dateStyle: "short",
    timeStyle: "short",
  }).format(ms);
}

export function formatExactDateTime(
  value: string | number | Date,
  locale: AppLocale,
): string {
  const ms =
    typeof value === "number"
      ? value
      : value instanceof Date
        ? value.getTime()
        : Date.parse(value);
  return new Intl.DateTimeFormat(localeToBcp47(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(ms);
}

export function formatNumber(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(localeToBcp47(locale)).format(value);
}

export function formatPercent(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(localeToBcp47(locale), {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}
