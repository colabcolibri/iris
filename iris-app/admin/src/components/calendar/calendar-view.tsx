import { AlertCircle, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  WEEKDAYS,
  addMonths,
  calendarCells,
  formatMonthLabel,
  postDisplayDate,
  sameDay,
  truncate,
} from "@/lib/date-utils";
import type { Post } from "@/lib/types";

type CalendarViewProps = {
  posts: Post[];
  cursor: Date;
  selectedId: string | null;
  onCursorChange: (date: Date) => void;
  onSelect: (post: Post) => void;
};

function formatChipTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CHIP_STYLES: Record<string, string> = {
  draft: "border-primary/20 bg-muted text-foreground",
  scheduled: "border-primary/20 bg-primary/10 text-primary",
  published: "border-emerald-600/30 bg-emerald-500/10 text-emerald-800",
  failed: "border-destructive/20 bg-destructive/10 text-destructive",
  cancelled: "border-border bg-muted text-muted-foreground",
};

export function CalendarView({
  posts,
  cursor,
  selectedId,
  onCursorChange,
  onSelect,
}: CalendarViewProps) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = calendarCells(year, month);
  const today = new Date();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
            <h2 className="min-w-[180px] text-center font-display text-2xl font-semibold">
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
      </header>

      <div className="mb-2 grid grid-cols-7 gap-px">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 gap-px overflow-auto rounded-lg border border-border/50 bg-border/30">
        {cells.map((day) => {
          const dayPosts = posts.filter((post) => {
            const raw = postDisplayDate(post);
            if (!raw) return false;
            return sameDay(new Date(raw), day);
          });

          const isOutside = day.getMonth() !== month;
          const isToday = sameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex min-h-[120px] flex-col gap-1 bg-card p-2 transition-colors hover:bg-muted/50",
                isOutside && "opacity-40",
                isToday && "ring-2 ring-inset ring-primary",
              )}
            >
              <span
                className={cn(
                  "inline-flex w-max p-1 text-sm font-semibold text-foreground",
                  isToday && "rounded bg-primary/15 font-bold text-primary",
                )}
              >
                {day.getDate()}
              </span>

              {dayPosts.slice(0, 3).map((post) => {
                const time = post.scheduled_at ? formatChipTime(post.scheduled_at) : "";
                const label = truncate(post.caption, 22);

                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => onSelect(post)}
                    title={post.error_message ?? post.caption ?? undefined}
                    className={cn(
                      "flex w-full items-center gap-1 truncate rounded-sm border px-2 py-1 text-left text-[10px] font-semibold",
                      CHIP_STYLES[post.status],
                      selectedId === post.id && "ring-2 ring-primary",
                    )}
                  >
                    {post.status === "failed" ? (
                      <AlertCircle className="size-3 shrink-0" />
                    ) : post.status === "scheduled" ? (
                      <Clock className="size-3 shrink-0" />
                    ) : (
                      <span className="size-1.5 shrink-0 rounded-full bg-current opacity-70" />
                    )}
                    <span className="truncate">
                      {time ? `${time} ${label}` : label}
                    </span>
                  </button>
                );
              })}

              {dayPosts.length > 3 && (
                <span className="px-1 text-[10px] text-muted-foreground">
                  +{dayPosts.length - 3} mais
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
