import { AlertCircle, Bot, ChevronLeft, ChevronRight, Clock, PauseCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  resolveEffectivePostReplyStatusFromPost,
  replyStatusPresentation,
} from "@iris/domain/reply-effective-status";
import {
  WEEKDAYS,
  addMonths,
  calendarCells,
  formatMonthLabel,
  postCalendarDate,
  sameDay,
  truncate,
} from "@/lib/date-utils";
import { formatChipTime, sameZonedCalendarDay } from "@/lib/datetime";
import { POST_STATUS_LABELS } from "@/lib/status";
import type { Post, PostStatus } from "@/lib/types";

type CalendarViewProps = {
  posts: Post[];
  cursor: Date;
  selectedId: string | null;
  timeZone: string;
  globalAutoReplyEnabled: boolean;
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
  globalAutoReplyEnabled,
  onCursorChange,
  onSelect,
  onCreatePost,
}: CalendarViewProps) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = calendarCells(year, month);
  const today = new Date();
  const rowCount = cells.length / 7;

  return (
    <div className="flex h-full min-h-0 flex-col pt-8">
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
            <h2 className="min-w-45 text-center font-display text-2xl font-semibold">
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
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold",
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
            className="h-9 rounded-full px-4 font-semibold uppercase tracking-wide shadow-sm sm:px-6"
          >
            <Plus className="mr-2 size-4" />
            Nova postagem
          </Button>
        </div>
      </header>

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
        className="grid min-h-0 flex-1 grid-cols-7 gap-px overflow-hidden rounded-lg border border-border/50 bg-border/30"
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

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex min-h-0 flex-col gap-1 overflow-y-auto bg-card p-2 transition-colors hover:bg-muted/50",
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
                const calendarDate = postCalendarDate(post);
                const time = calendarDate ? formatChipTime(calendarDate, timeZone) : "";
                const label = truncate(post.caption, 18);
                const statusLabel = POST_STATUS_LABELS[post.status];
                const replyStatus = resolveEffectivePostReplyStatusFromPost(
                  globalAutoReplyEnabled,
                  post,
                );
                const replyCopy = replyStatusPresentation(replyStatus);
                const ReplyIcon =
                  replyStatus.kind === "paused"
                    ? PauseCircle
                    : replyStatus.kind === "off"
                      ? null
                      : Bot;

                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => onSelect(post)}
                    title={`${statusLabel}${time ? ` · ${time}` : ""} · ${replyCopy.label} — ${post.caption ?? ""}`}
                    className={cn(
                      "flex w-full flex-col gap-0.5 truncate rounded-sm border px-2 py-1 text-left text-[10px] font-semibold",
                      CHIP_STYLES[post.status],
                      selectedId === post.id && "ring-2 ring-primary",
                    )}
                  >
                    <span className="flex items-center gap-1 truncate">
                      {post.status === "failed" ? (
                        <AlertCircle className="size-3 shrink-0" />
                      ) : post.status === "scheduled" ? (
                        <Clock className="size-3 shrink-0" />
                      ) : (
                        <span className="size-1.5 shrink-0 rounded-full bg-current opacity-70" />
                      )}
                      <span className="truncate opacity-80">{statusLabel}</span>
                      {time && <span className="shrink-0 opacity-70">{time}</span>}
                    </span>
                    <span className="truncate font-normal opacity-90">{label}</span>
                    {ReplyIcon ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 truncate font-medium",
                          replyStatus.kind === "auto" && "text-emerald-800",
                          replyStatus.kind === "draft" && "text-sky-900",
                          replyStatus.kind === "paused" && "text-amber-900",
                        )}
                      >
                        <ReplyIcon className="size-2.5 shrink-0" />
                        <span className="truncate">{replyCopy.shortLabel}</span>
                      </span>
                    ) : null}
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
