import type { Post } from "@/lib/types";
import { calendarDayKey } from "@/lib/datetime";

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function formatMonthLabel(year: number, monthIndex: number) {
  return `${MONTHS[monthIndex]} ${year}`;
}

export function postDisplayDate(post: Post) {
  return post.scheduled_at ?? post.published_at ?? post.created_at;
}

/** Data usada no calendário — só agendamentos e publicações reais, nunca created_at. */
export function postCalendarDate(post: Post): string | null {
  if (post.status === "published") {
    return post.published_at ?? post.scheduled_at;
  }
  if (post.status === "scheduled" || post.status === "failed") {
    return post.scheduled_at;
  }
  return null;
}

export function truncate(text: string | null | undefined, max = 48) {
  const value = (text ?? "").trim();
  if (value.length <= max) return value || "(sem legenda)";
  return `${value.slice(0, max - 1)}…`;
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/** Agrupa postagens por dia editorial (chave YYYY-MM-DD na timezone). Só dias com conteúdo. */
export function groupPostsByCalendarDay(
  posts: Post[],
  timeZone: string,
): { dayKey: string; sortIso: string; posts: Post[] }[] {
  const buckets = new Map<string, { sortIso: string; posts: Post[] }>();

  for (const post of posts) {
    const raw = postCalendarDate(post);
    if (!raw) continue;
    const key = calendarDayKey(raw, timeZone);
    if (!key || key === "—") continue;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.posts.push(post);
      if (raw < bucket.sortIso) bucket.sortIso = raw;
    } else {
      buckets.set(key, { sortIso: raw, posts: [post] });
    }
  }

  return [...buckets.entries()]
    .map(([key, value]) => ({
      dayKey: key,
      sortIso: value.sortIso,
      posts: [...value.posts].sort((a, b) => {
        const aIso = postCalendarDate(a) ?? "";
        const bIso = postCalendarDate(b) ?? "";
        return aIso.localeCompare(bIso);
      }),
    }))
    .sort((a, b) => a.sortIso.localeCompare(b.sortIso));
}

export function calendarCells(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const start = new Date(year, monthIndex, 1 - first.getDay());
  const cells: Date[] = [];

  for (let i = 0; i < 42; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    cells.push(day);
  }

  return cells;
}
