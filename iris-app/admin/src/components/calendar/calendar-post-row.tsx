import { Bot, Plus } from "lucide-react";
import { StatusBadge } from "@/components/posts/status-badge";
import { Button } from "@/components/ui/button";
import { getPostStatusLabel } from "@/i18n/domains/labels/helpers";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import {
  resolveEffectivePostReplyStatusFromPost,
  replyStatusPresentation,
} from "@iris/domain/reply-effective-status";
import { postCalendarDate, truncate } from "@/lib/date-utils";
import { formatChipTime } from "@/lib/datetime";
import type { Post, ReplyMode } from "@/lib/types";

type CalendarPostRowProps = {
  post: Post;
  selected: boolean;
  timeZone: string;
  globalReplyMode: ReplyMode;
  onSelect: (post: Post) => void;
  compact?: boolean;
};

export function CalendarPostRow({
  post,
  selected,
  timeZone,
  globalReplyMode,
  onSelect,
  compact = false,
}: CalendarPostRowProps) {
  const { locale } = useAppLocale();
  const postsMessages = useDomainMessages("posts");
  const calendarDate = postCalendarDate(post);
  const time = calendarDate ? formatChipTime(calendarDate, timeZone) : "";
  const label = truncate(post.caption, compact ? 42 : 96);
  const statusLabel = getPostStatusLabel(post.status, locale);
  const replyStatus = resolveEffectivePostReplyStatusFromPost(
    globalReplyMode,
    post,
  );
  const replyCopy = replyStatusPresentation(replyStatus);
  const ReplyIcon = replyStatus.kind === "off" ? null : Bot;

  return (
    <button
      type="button"
      onClick={() => onSelect(post)}
      title={`${statusLabel}${time ? ` · ${time}` : ""} · ${replyCopy.label} — ${post.caption ?? ""}`}
      className={cn(
        "flex w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-(--iris-radius-sm) border border-border bg-background text-left shadow-none transition-colors hover:border-primary/40",
        compact ? "shrink gap-0.5 px-1.5 py-1" : "gap-1.5 px-3 py-2.5 sm:px-4",
        selected && "border-primary ring-1 ring-primary",
      )}
    >
      <div className="flex min-w-0 shrink-0 items-center gap-1">
        <StatusBadge
          status={post.status}
          className={compact ? "px-1.5 py-0 text-xs leading-tight" : undefined}
        />
        {time ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {time}
          </span>
        ) : null}
      </div>
      <span
        className={cn(
          "min-w-0 font-semibold text-foreground",
          compact
            ? "truncate text-xs leading-tight"
            : "line-clamp-2 text-sm leading-snug",
        )}
      >
        {label || postsMessages.calendar.noCaption}
      </span>
      {!compact && ReplyIcon ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 truncate text-xs font-semibold",
            replyStatus.kind === "auto" && "text-emerald-800",
            replyStatus.kind === "draft" && "text-sky-900",
            replyStatus.kind === "off" && "text-amber-900",
          )}
        >
          <ReplyIcon className="size-2.5 shrink-0" />
          <span className="truncate">{replyCopy.shortLabel}</span>
        </span>
      ) : null}
    </button>
  );
}

type CalendarMonthEmptyProps = {
  onCreatePost: () => void;
};

export function CalendarMonthEmpty({ onCreatePost }: CalendarMonthEmptyProps) {
  const postsMessages = useDomainMessages("posts");

  return (
    <div className="mb-4 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
      <p className="font-display text-lg font-semibold text-foreground">
        {postsMessages.calendar.emptyMonthTitle}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {postsMessages.calendar.emptyMonthBody}
      </p>
      <Button type="button" className="mt-4" onClick={onCreatePost}>
        <Plus className="mr-2 size-4" />
        {postsMessages.page.kanban.newPost}
      </Button>
    </div>
  );
}
