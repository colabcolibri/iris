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

export function monthRange(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const from = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)).toISOString();
  const to = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)).toISOString();
  return { from, to };
}

export function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
