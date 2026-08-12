import {
  formatInTimeZone,
  monthRangeInTimeZone,
  sameZonedCalendarDay,
  utcIsoToZonedLocal,
  zonedLocalToUtcIso,
} from "@iris/domain/zoned-datetime";
import { TIMEZONE_OPTIONS, DEFAULT_TIMEZONE } from "@iris/domain/timezone";

export { TIMEZONE_OPTIONS, DEFAULT_TIMEZONE, sameZonedCalendarDay };

export function toIsoFromDatetimeLocal(value: string, timeZone: string) {
  return zonedLocalToUtcIso(value, timeZone);
}

export function toDatetimeLocalFromIso(
  iso: string | null | undefined,
  timeZone: string,
) {
  if (!iso) return "";
  return utcIsoToZonedLocal(iso, timeZone);
}

export function monthRange(date: Date, timeZone: string) {
  return monthRangeInTimeZone(date.getFullYear(), date.getMonth(), timeZone);
}

export function formatWhen(iso: string | null | undefined, timeZone: string) {
  return formatInTimeZone(iso, timeZone, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatChipTime(iso: string, timeZone: string) {
  return formatInTimeZone(iso, timeZone, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Chave estável do dia editorial na timezone (YYYY-MM-DD). */
export function calendarDayKey(iso: string, timeZone: string) {
  const local = utcIsoToZonedLocal(iso, timeZone);
  return local ? local.slice(0, 10) : "—";
}

/** Cabeçalho de dia na lista editorial, ex.: "Quarta-feira, 12 de agosto". */
export function formatCalendarDayHeading(iso: string, timeZone: string) {
  const raw = formatInTimeZone(iso, timeZone, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  if (!raw || raw === "—") return raw;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export { formatInTimeZone };
