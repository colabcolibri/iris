import { isValidIanaTimeZone } from "./timezone.ts";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function pad(part: number) {
  return String(part).padStart(2, "0");
}

function readZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === "24" ? "0" : parts.hour),
    minute: Number(parts.minute),
  };
}

function compareParts(a: ZonedParts, b: ZonedParts): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  if (a.day !== b.day) return a.day - b.day;
  if (a.hour !== b.hour) return a.hour - b.hour;
  return a.minute - b.minute;
}

export function zonedLocalToUtcIso(local: string, timeZone: string): string | null {
  if (!isValidIanaTimeZone(timeZone)) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!match) {
    return null;
  }

  const target: ZonedParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };

  let low =
    Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute) -
    15 * 3_600_000;
  let high =
    Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute) +
    15 * 3_600_000;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const mid = Math.floor((low + high) / 2);
    const parts = readZonedParts(new Date(mid), timeZone);
    const cmp = compareParts(parts, target);

    if (cmp === 0) {
      return new Date(mid).toISOString();
    }

    if (cmp < 0) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return null;
}

export function utcIsoToZonedLocal(iso: string, timeZone: string): string {
  if (!isValidIanaTimeZone(timeZone)) {
    return "";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = readZonedParts(date, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function formatInTimeZone(
  iso: string | null | undefined,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || !isValidIanaTimeZone(timeZone)) {
    return "—";
  }

  return date.toLocaleString("pt-BR", { ...options, timeZone });
}

export function monthRangeInTimeZone(year: number, monthIndex: number, timeZone: string) {
  const month = monthIndex + 1;
  const lastDay = daysInMonth(year, monthIndex);
  const from =
    zonedLocalToUtcIso(`${year}-${pad(month)}-01T00:00`, timeZone) ??
    new Date(Date.UTC(year, monthIndex, 1)).toISOString();

  const endLocal = zonedLocalToUtcIso(
    `${year}-${pad(month)}-${pad(lastDay)}T23:59`,
    timeZone,
  );
  const to = endLocal
    ? new Date(new Date(endLocal).getTime() + 59_999).toISOString()
    : new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999)).toISOString();

  return { from, to };
}

function shiftZonedCalendarDay(
  anchor: Date,
  timeZone: string,
  dayOffset: number,
): ZonedParts {
  const parts = readZonedParts(anchor, timeZone);
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day + dayOffset, 12, 0, 0);
  return readZonedParts(new Date(utc), timeZone);
}

/** Início e fim de um dia editorial (offset relativo a hoje na timezone). */
export function zonedCalendarDayBounds(
  timeZone: string,
  anchor: Date,
  dayOffset: number,
): { from: string; to: string } {
  const target = shiftZonedCalendarDay(anchor, timeZone, dayOffset);
  const y = target.year;
  const m = pad(target.month);
  const d = pad(target.day);
  const from =
    zonedLocalToUtcIso(`${y}-${m}-${d}T00:00`, timeZone) ??
    new Date(Date.UTC(y, target.month - 1, target.day)).toISOString();
  const endLocal = zonedLocalToUtcIso(`${y}-${m}-${d}T23:59`, timeZone);
  const to = endLocal
    ? new Date(new Date(endLocal).getTime() + 59_999).toISOString()
    : new Date(Date.UTC(y, target.month - 1, target.day, 23, 59, 59, 999)).toISOString();
  return { from, to };
}

/** Janela editorial ancorada em hoje: N dias para trás e M dias para frente. */
export function zonedCalendarWindowBounds(
  timeZone: string,
  anchor: Date,
  pastDays: number,
  futureDays: number,
): { from: string; to: string } {
  const start = zonedCalendarDayBounds(timeZone, anchor, -Math.max(0, pastDays));
  const end = zonedCalendarDayBounds(timeZone, anchor, Math.max(0, futureDays));
  return { from: start.from, to: end.to };
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function zonedDayParts(iso: string, timeZone: string) {
  if (!isValidIanaTimeZone(timeZone)) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return readZonedParts(date, timeZone);
}

export function sameZonedCalendarDay(iso: string, cell: Date, timeZone: string) {
  const parts = zonedDayParts(iso, timeZone);
  if (!parts) {
    return false;
  }

  return (
    parts.year === cell.getFullYear() &&
    parts.month === cell.getMonth() + 1 &&
    parts.day === cell.getDate()
  );
}
