import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  CalendarMonthEmpty,
  CalendarPostRow,
} from "@/components/calendar/calendar-post-row";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { Button } from "@/components/ui/button";
import { interpolate } from "@/i18n/compose";
import { useDomainMessages } from "@/i18n/provider";
import {
  addMonths,
  formatMonthLabel,
  groupPostsByCalendarDay,
} from "@/lib/date-utils";
import { formatCalendarDayHeading } from "@/lib/datetime";
import type { Post, ReplyMode } from "@/lib/types";

type CalendarListViewProps = {
  posts: Post[];
  cursor: Date;
  selectedId: string | null;
  timeZone: string;
  globalReplyMode: ReplyMode;
  onCursorChange: (date: Date) => void;
  onSelect: (post: Post) => void;
  onCreatePost: () => void;
};

export function CalendarListView({
  posts,
  cursor,
  selectedId,
  timeZone,
  globalReplyMode,
  onCursorChange,
  onSelect,
  onCreatePost,
}: CalendarListViewProps) {
  const listMsg = useDomainMessages("posts").kanban.calendarList;
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const days = groupPostsByCalendarDay(posts, timeZone);

  return (
    <div className="flex h-full min-h-0 flex-col pt-6 md:pt-8">
      <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {listMsg.eyebrow}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => onCursorChange(addMonths(cursor, -1))}
              aria-label={listMsg.prevMonthAria}
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
              aria-label={listMsg.nextMonthAria}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={onCreatePost}
          className="h-11 sm:px-6"
        >
          <Plus className="mr-2 size-4" />
          {listMsg.newPost}
        </Button>
      </header>

      {days.length === 0 ? (
        <CalendarMonthEmpty onCreatePost={onCreatePost} />
      ) : (
        <PageScrollArea contentClassName="space-y-6 pb-2">
          {days.map((day) => (
            <section key={day.dayKey} className="min-w-0">
              <h3 className="mb-2 text-sm font-semibold tracking-wide text-foreground">
                {formatCalendarDayHeading(day.sortIso, timeZone)}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {day.posts.length === 1
                    ? interpolate(listMsg.postOne, { count: day.posts.length })
                    : interpolate(listMsg.postOther, { count: day.posts.length })}
                </span>
              </h3>
              <div className="flex flex-col gap-2">
                {day.posts.map((post) => (
                  <CalendarPostRow
                    key={post.id}
                    post={post}
                    selected={selectedId === post.id}
                    timeZone={timeZone}
                    globalReplyMode={globalReplyMode}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </section>
          ))}
        </PageScrollArea>
      )}
    </div>
  );
}
