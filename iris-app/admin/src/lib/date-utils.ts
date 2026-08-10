import type { Post } from "@/lib/types";

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
