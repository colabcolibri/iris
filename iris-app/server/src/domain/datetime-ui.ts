import { ValidationError } from "../api/json.ts";
import { utcIsoToZonedLocal, zonedLocalToUtcIso } from "./zoned-datetime.ts";
import { resolveTimeZone } from "./timezone.ts";

export function parseIsoDateParam(value: string, fieldName: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid ISO 8601 date`);
  }

  return date.toISOString();
}

export function toIsoFromDatetimeLocal(
  value: string | null | undefined,
  timeZone?: string,
): string | null {
  if (!value) {
    return null;
  }

  const resolved = resolveTimeZone(timeZone);
  const iso = zonedLocalToUtcIso(value, resolved);
  if (iso) {
    return iso;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export function toDatetimeLocalFromIso(
  iso: string | null | undefined,
  timeZone?: string,
): string {
  if (!iso) {
    return "";
  }

  const resolved = resolveTimeZone(timeZone);
  const local = utcIsoToZonedLocal(iso, resolved);
  if (local) {
    return local;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
