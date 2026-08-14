import { Clock, ImageIcon, MoreVertical, PlayCircle } from "lucide-react";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { PostReplyStatusBadge } from "@/components/posts/post-reply-status-badge";
import { KanbanColumnShell } from "@/components/templates/kanban-column-shell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDomainMessages } from "@/i18n/provider";
import { formatWhen } from "@/lib/datetime";
import { postDisplayDate, truncate } from "@/lib/date-utils";
import { getKanbanActions } from "@/lib/status";
import type { Post, PostStatus, ReplyMode } from "@/lib/types";

type KanbanCardProps = {
  post: Post;
  timeZone: string;
  globalReplyMode: ReplyMode;
  onOpen: () => void;
  onStatusChange: (status: PostStatus) => void;
  onPurge?: () => void;
};

function dateMeta(
  post: Post,
  timeZone: string,
  card: ReturnType<typeof useDomainMessages<"posts">>["kanban"]["card"],
) {
  const when = formatWhen(postDisplayDate(post), timeZone);
  if (!when) return null;

  switch (post.status) {
    case "scheduled":
      return { label: card.publishesAt, when, tone: "scheduled" as const };
    case "published":
      return { label: card.publishedAt, when, tone: "published" as const };
    case "failed":
      return { label: card.failedAt, when, tone: "failed" as const };
    case "draft":
      return post.scheduled_at
        ? { label: card.plannedDate, when, tone: "draft" as const }
        : null;
    case "cancelled":
      return post.scheduled_at
        ? { label: card.wasScheduledFor, when, tone: "muted" as const }
        : null;
    default:
      return null;
  }
}

export function KanbanCard({
  post,
  timeZone,
  globalReplyMode,
  onOpen,
  onStatusChange,
  onPurge,
}: KanbanCardProps) {
  const cardMsg = useDomainMessages("posts").kanban.card;
  const actions = getKanbanActions(post.status);
  const meta = dateMeta(post, timeZone, cardMsg);
  const isFailed = post.status === "failed";
  const isPublished = post.status === "published";
  const assetsCount = post.assets_count ?? 0;

  const menu =
    actions.length > 0 ? (
      <div className="absolute top-2 right-2 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
                aria-label={cardMsg.actionsAria}
                onClick={(event) => event.stopPropagation()}
              />
            }
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{cardMsg.actionsLabel}</DropdownMenuLabel>
              {actions.map((action) => (
                <DropdownMenuItem
                  key={
                    action.kind === "status"
                      ? `status-${action.status}`
                      : "purge"
                  }
                  variant={action.variant}
                  onClick={() => {
                    if (action.kind === "purge") {
                      onPurge?.();
                      return;
                    }
                    onStatusChange(action.status);
                  }}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) : null;

  return (
    <KanbanColumnShell.Card
      onOpen={onOpen}
      variant={isFailed ? "failed" : "default"}
      actions={menu}
    >
      {isPublished && assetsCount > 0 && (
        <div className="relative -mx-4 -mt-4 mb-3 h-24 overflow-hidden rounded-t-(--iris-radius-lg) bg-muted">
          <div className="flex h-full items-center justify-center bg-linear-to-br from-primary/10 to-muted">
            <PlayCircle className="size-8 text-primary/60" />
          </div>
        </div>
      )}

      <p className="mb-2 text-sm leading-snug font-semibold text-foreground group-hover:text-primary">
        {truncate(post.caption, 96)}
      </p>

      {meta && (
        <div className="mb-3 space-y-0.5">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {meta.label}
          </p>
          <span
            className={
              meta.tone === "published"
                ? "inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700"
                : meta.tone === "failed"
                  ? "inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive"
                  : meta.tone === "draft"
                    ? "inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-800"
                    : meta.tone === "muted"
                      ? "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground line-through"
                      : "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary"
            }
          >
            <Clock className="size-3" />
            {meta.when}
          </span>
        </div>
      )}

      {isFailed && post.error_message && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
          <span className="shrink-0 font-semibold">{cardMsg.error}</span>
          <span className="line-clamp-2">{post.error_message}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {post.channel === "instagram" && (
          <span className="inline-flex items-center gap-1">
            <InstagramIcon className="size-3.5" />
            Instagram
          </span>
        )}
        {assetsCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <ImageIcon className="size-3.5" />
            {assetsCount}{" "}
            {assetsCount === 1 ? cardMsg.mediaOne : cardMsg.mediaOther}
          </span>
        ) : (
          <span className="text-amber-700">{cardMsg.noMedia}</span>
        )}
        <PostReplyStatusBadge post={post} globalReplyMode={globalReplyMode} />
      </div>
    </KanbanColumnShell.Card>
  );
}
