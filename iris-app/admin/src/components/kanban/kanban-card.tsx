import { Clock, ImageIcon, MoreHorizontal, PlayCircle } from "lucide-react";
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
import { formatWhen, postDisplayDate, truncate } from "@/lib/date-utils";
import { MOVE_STATUS_OPTIONS } from "@/lib/status";
import type { Post, PostStatus } from "@/lib/types";

type KanbanCardProps = {
  post: Post;
  onOpen: () => void;
  onStatusChange: (status: PostStatus) => void;
};

export function KanbanCard({ post, onOpen, onStatusChange }: KanbanCardProps) {
  const moveOptions = MOVE_STATUS_OPTIONS.filter((option) => option.value !== post.status);
  const when = formatWhen(postDisplayDate(post));
  const isFailed = post.status === "failed";
  const isPublished = post.status === "published";
  const isScheduled = post.status === "scheduled";

  return (
    <KanbanColumnShell.Card
      onOpen={onOpen}
      variant={isFailed ? "failed" : "default"}
      footer={
        moveOptions.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="Ações da postagem" />}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Mover para</DropdownMenuLabel>
                {moveOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onStatusChange(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : undefined
      }
    >
      {isPublished && (post.assets_count ?? 0) > 0 && (
        <div className="relative -mx-4 -mt-4 mb-3 h-24 overflow-hidden rounded-t-xl bg-muted">
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-muted">
            <PlayCircle className="size-8 text-primary/60" />
          </div>
        </div>
      )}

      <p className="mb-3 text-sm leading-snug font-medium text-foreground group-hover:text-primary">
        {truncate(post.caption, 96)}
      </p>

      {(isScheduled || isPublished) && when && (
        <div className="mb-3">
          <span
            className={
              isPublished
                ? "inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-700"
                : "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary"
            }
          >
            <Clock className="size-3" />
            {when}
          </span>
        </div>
      )}

      {isFailed && post.error_message && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
          <span className="shrink-0 font-semibold">Erro:</span>
          <span className="line-clamp-2">{post.error_message}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {(post.assets_count ?? 0) > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ImageIcon className="size-3.5" />
            {post.assets_count} {post.assets_count === 1 ? "asset" : "assets"}
          </span>
        ) : (
          <span />
        )}
        {post.status === "draft" && (
          <span className="size-2 rounded-full bg-amber-400" aria-hidden />
        )}
      </div>
    </KanbanColumnShell.Card>
  );
}
