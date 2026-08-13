import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
} from "lucide-react";
import {
  CalendarMonthEmpty,
  CalendarPostRow,
} from "@/components/calendar/calendar-post-row";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  WEEKDAYS,
  addMonths,
  calendarCells,
  formatMonthLabel,
  postCalendarDate,
  sameDay,
} from "@/lib/date-utils";
import { sameZonedCalendarDay } from "@/lib/datetime";
import { POST_STATUS_LABELS } from "@/lib/status";
import type { Post, PostStatus, ReplyMode } from "@/lib/types";

type CalendarViewProps = {
  posts: Post[];
  cursor: Date;
  selectedId: string | null;
  timeZone: string;
  globalReplyMode: ReplyMode;
  onCursorChange: (date: Date) => void;
  onSelect: (post: Post) => void;
  onCreatePost: () => void;
};

const CHIP_STYLES: Record<PostStatus, string> = {
  draft: "border-primary/20 bg-muted text-foreground",
  scheduled: "border-primary/20 bg-primary/10 text-primary",
  published: "border-emerald-600/30 bg-emerald-500/10 text-emerald-800",
  monitored: "border-amber-600/30 bg-amber-500/10 text-amber-900",
  failed: "border-destructive/20 bg-destructive/10 text-destructive",
  cancelled: "border-border bg-muted text-muted-foreground",
};

const CALENDAR_LEGEND: PostStatus[] = ["scheduled", "published", "failed"];

export function CalendarView({
  posts,
  cursor,
  selectedId,
  timeZone,
  globalReplyMode,
  onCursorChange,
  onSelect,
  onCreatePost,
}: CalendarViewProps) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = calendarCells(year, month);
  const today = new Date();
  const rowCount = cells.length / 7;
  const monthHasPosts = posts.some((post) => {
    const raw = postCalendarDate(post);
    if (!raw) return false;
    const d = new Date(raw);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  return (
    <div className="flex h-full min-h-0 flex-col pt-6 md:pt-8">
      <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Calendário editorial
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => onCursorChange(addMonths(cursor, -1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="min-w-45 text-center font-display text-2xl font-semibold sm:text-3xl">
              {formatMonthLabel(year, month)}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => onCursorChange(addMonths(cursor, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {CALENDAR_LEGEND.map((status) => (
            <span
              key={status}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                CHIP_STYLES[status],
              )}
            >
              {status === "scheduled" ? (
                <Clock className="size-3" />
              ) : status === "failed" ? (
                <AlertCircle className="size-3" />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
              {POST_STATUS_LABELS[status]}
            </span>
          ))}
          <Button
            type="button"
            size="sm"
            onClick={onCreatePost}
            className="h-11 sm:px-6"
          >
            <Plus className="mr-2 size-4" />
            Nova postagem
          </Button>
        </div>
      </header>

      {!monthHasPosts ? <CalendarMonthEmpty onCreatePost={onCreatePost} /> : null}

      <div className="mb-2 grid shrink-0 grid-cols-7 gap-px">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {label}
          </div>
        ))}
      </div>

      <div
        className="grid min-h-0 flex-1 grid-cols-7 gap-1 overflow-hidden sm:gap-1.5"
        style={{ gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}
      >
        {cells.map((day) => {
          const dayPosts = posts.filter((post) => {
            const raw = postCalendarDate(post);
            if (!raw) return false;
            return sameZonedCalendarDay(raw, day, timeZone);
          });

          const isOutside = day.getMonth() !== month;
          const isToday = sameDay(day, today);
          const hasPosts = dayPosts.length > 0;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex min-h-0 flex-col overflow-hidden rounded-(--iris-radius-sm) border transition-colors",
                hasPosts
                  ? "gap-1 border-border bg-card p-1 sm:p-1.5"
                  : "gap-0 border-transparent bg-muted/25 p-1",
                isOutside && "opacity-35",
                isToday &&
                  hasPosts &&
                  "ring-2 ring-primary ring-offset-1 ring-offset-background",
                isToday && !hasPosts && "ring-1 ring-inset ring-primary/40",
              )}
            >
              <span
                className={cn(
                  "inline-flex w-max shrink-0 px-1 text-xs font-semibold tabular-nums",
                  hasPosts ? "text-foreground" : "text-muted-foreground/70",
                  isToday &&
                    "rounded-(--iris-radius-sm) bg-primary/15 text-primary",
                )}
              >
                {day.getDate()}
              </span>

              {hasPosts ? (
                <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                  {dayPosts.slice(0, 3).map((post) => (
                    <CalendarPostRow
                      key={post.id}
                      post={post}
                      selected={selectedId === post.id}
                      timeZone={timeZone}
                      globalReplyMode={globalReplyMode}
                      onSelect={onSelect}
                      compact
                    />
                  ))}

                  {dayPosts.length > 3 ? (
                    <span className="shrink-0 truncate px-1 text-xs text-muted-foreground">
                      +{dayPosts.length - 3} mais
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
