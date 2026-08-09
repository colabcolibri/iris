const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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

export function formatMonthLabel(year, monthIndex) {
  return `${MONTHS[monthIndex]} ${year}`;
}

export function postDisplayDate(post) {
  return post.scheduled_at ?? post.published_at ?? post.created_at;
}

export function truncate(text, max = 48) {
  const value = (text ?? "").trim();
  if (value.length <= max) return value || "(sem legenda)";
  return `${value.slice(0, max - 1)}…`;
}

export function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function calendarCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const start = new Date(year, monthIndex, 1 - first.getDay());
  const cells = [];

  for (let i = 0; i < 42; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    cells.push(day);
  }

  return cells;
}

export function monthRange(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const from = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)).toISOString();
  const to = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)).toISOString();
  return { from, to };
}

export { WEEKDAYS };
