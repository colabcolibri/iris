import {
  formatInTimeZone,
  monthRangeInTimeZone,
  zonedCalendarWindowBounds,
} from "../time/zoned-datetime.ts";

export type PipelineDateFilter =
  | { kind: "all" }
  | { kind: "window"; pastDays: number; futureDays: number }
  | { kind: "month"; offset: 0 | 1 };

export type PipelineDatePresetId =
  | "all"
  | "default"
  | "past-30"
  | "past-60"
  | "future-30"
  | "future-60"
  | "current-month"
  | "next-month"
  | "custom";

export const DEFAULT_PIPELINE_DATE_FILTER: PipelineDateFilter = {
  kind: "window",
  pastDays: 0,
  futureDays: 15,
};

export const PIPELINE_DAY_OPTIONS = [0, 7, 15, 30, 60, 90] as const;

export type PipelinePostForDateFilter = {
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
};

export function postPipelineEditorialDate(
  post: PipelinePostForDateFilter,
): string | null {
  if (post.status === "published" || post.status === "monitored") {
    return post.published_at ?? post.scheduled_at;
  }
  if (
    post.status === "scheduled" ||
    post.status === "failed" ||
    post.status === "draft" ||
    post.status === "cancelled"
  ) {
    return post.scheduled_at;
  }
  return null;
}

export function resolvePipelineDateRange(
  filter: PipelineDateFilter,
  timeZone: string,
  anchor: Date = new Date(),
): { from: string; to: string } | null {
  if (filter.kind === "all") {
    return null;
  }

  if (filter.kind === "window") {
    return zonedCalendarWindowBounds(
      timeZone,
      anchor,
      filter.pastDays,
      filter.futureDays,
    );
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
  })
    .formatToParts(anchor)
    .reduce(
      (acc, part) => {
        if (part.type === "year" || part.type === "month") {
          acc[part.type] = Number(part.value);
        }
        return acc;
      },
      { year: 0, month: 0 },
    );

  const monthIndex = parts.month - 1 + filter.offset;
  const year = parts.year + Math.floor(monthIndex / 12);
  const normalizedMonth = ((monthIndex % 12) + 12) % 12;

  return monthRangeInTimeZone(year, normalizedMonth, timeZone);
}

export function matchesPipelineDateFilter(
  post: PipelinePostForDateFilter,
  filter: PipelineDateFilter,
  timeZone: string,
  anchor: Date = new Date(),
): boolean {
  if (filter.kind === "all") {
    return true;
  }

  const editorialDate = postPipelineEditorialDate(post);
  if (!editorialDate) {
    return post.status === "draft";
  }

  const range = resolvePipelineDateRange(filter, timeZone, anchor);
  if (!range) {
    return true;
  }

  return editorialDate >= range.from && editorialDate <= range.to;
}

export function filterPostsByPipelineDate<T extends PipelinePostForDateFilter>(
  posts: T[],
  filter: PipelineDateFilter,
  timeZone: string,
  anchor: Date = new Date(),
): T[] {
  return posts.filter((post) =>
    matchesPipelineDateFilter(post, filter, timeZone, anchor),
  );
}

function sameWindow(
  a: PipelineDateFilter,
  b: { pastDays: number; futureDays: number },
) {
  return (
    a.kind === "window" &&
    a.pastDays === b.pastDays &&
    a.futureDays === b.futureDays
  );
}

export function pipelineFilterToPresetId(
  filter: PipelineDateFilter,
): PipelineDatePresetId {
  if (filter.kind === "all") return "all";
  if (filter.kind === "month") {
    return filter.offset === 0 ? "current-month" : "next-month";
  }
  if (sameWindow(filter, { pastDays: 0, futureDays: 15 })) return "default";
  if (sameWindow(filter, { pastDays: 30, futureDays: 0 })) return "past-30";
  if (sameWindow(filter, { pastDays: 60, futureDays: 0 })) return "past-60";
  if (sameWindow(filter, { pastDays: 0, futureDays: 30 })) return "future-30";
  if (sameWindow(filter, { pastDays: 0, futureDays: 60 })) return "future-60";
  return "custom";
}

export function pipelinePresetIdToFilter(
  preset: PipelineDatePresetId,
  custom?: { pastDays: number; futureDays: number },
): PipelineDateFilter {
  switch (preset) {
    case "all":
      return { kind: "all" };
    case "default":
      return { kind: "window", pastDays: 0, futureDays: 15 };
    case "past-30":
      return { kind: "window", pastDays: 30, futureDays: 0 };
    case "past-60":
      return { kind: "window", pastDays: 60, futureDays: 0 };
    case "future-30":
      return { kind: "window", pastDays: 0, futureDays: 30 };
    case "future-60":
      return { kind: "window", pastDays: 0, futureDays: 60 };
    case "current-month":
      return { kind: "month", offset: 0 };
    case "next-month":
      return { kind: "month", offset: 1 };
    case "custom":
      return {
        kind: "window",
        pastDays: custom?.pastDays ?? 0,
        futureDays: custom?.futureDays ?? 15,
      };
  }
}

function capitalizeFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatPipelineDateFilterLabel(
  filter: PipelineDateFilter,
  timeZone: string,
  anchor: Date = new Date(),
): string {
  if (filter.kind === "all") {
    return "Tudo";
  }

  if (filter.kind === "month") {
    const range = resolvePipelineDateRange(filter, timeZone, anchor);
    if (!range) return filter.offset === 0 ? "Mês atual" : "Próximo mês";
    const raw = formatInTimeZone(range.from, timeZone, {
      month: "long",
      year: "numeric",
    });
    if (filter.offset === 1 && raw === "—") return "Próximo mês";
    if (filter.offset === 0 && raw === "—") return "Mês atual";
    return capitalizeFirst(raw);
  }

  const range = resolvePipelineDateRange(filter, timeZone, anchor);
  if (!range) return "Período";

  const { pastDays, futureDays } = filter;

  if (pastDays > 0 && futureDays === 0) {
    return `Últimos ${pastDays} dias`;
  }

  if (pastDays === 0 && futureDays > 0) {
    const end = formatInTimeZone(range.to, timeZone, {
      day: "numeric",
      month: "short",
    });
    if (end === "—") return `Hoje → +${futureDays} dias`;
    return `Hoje → ${end}`;
  }

  const start = formatInTimeZone(range.from, timeZone, {
    day: "numeric",
    month: "short",
  });
  const end = formatInTimeZone(range.to, timeZone, {
    day: "numeric",
    month: "short",
  });
  if (start !== "—" && end !== "—") {
    return `${start} → ${end}`;
  }

  return `−${pastDays}d → +${futureDays}d`;
}

export function parsePipelineDateFilterJson(
  raw: string | null | undefined,
): PipelineDateFilter | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as PipelineDateFilter;
    if (value.kind === "all") return { kind: "all" };
    if (value.kind === "month" && (value.offset === 0 || value.offset === 1)) {
      return value;
    }
    if (
      value.kind === "window" &&
      Number.isFinite(value.pastDays) &&
      Number.isFinite(value.futureDays) &&
      value.pastDays >= 0 &&
      value.futureDays >= 0
    ) {
      return {
        kind: "window",
        pastDays: Math.floor(value.pastDays),
        futureDays: Math.floor(value.futureDays),
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function serializePipelineDateFilter(filter: PipelineDateFilter): string {
  return JSON.stringify(filter);
}
