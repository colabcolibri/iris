import { memo } from "react";
import { Heart, ImageIcon, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { postPreviewUrl } from "@/hooks/use-post-preview";
import type { CommentPostSummary, IgMediaStatus } from "@/lib/types";
import { igMediaStatusPresentation } from "@iris/domain/meta/ig-media-status";

type PostInboxListProps = {
  posts: CommentPostSummary[];
  selectedPostId: string;
  thumbnailOverrides?: Record<string, string | null | undefined>;
  onSelect: (postId: string) => void;
};

function formatListDate(value: string | null): string {
  if (!value) {
    return "sem data";
  }
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function listCaption(caption: string | null): string {
  const text = caption?.trim();
  if (!text) {
    return "(sem legenda)";
  }
  return text.split("\n")[0]?.trim() ?? text;
}

function resolveThumbnail(
  post: CommentPostSummary,
  thumbnailOverrides?: Record<string, string | null | undefined>,
): string | null {
  const override = thumbnailOverrides?.[post.post_id];
  if (override) {
    return override;
  }
  return postPreviewUrl(post);
}

function igMediaBadge(
  status: IgMediaStatus | null | undefined,
): { label: string; className: string } | null {
  if (!status || status === "on_feed") {
    return null;
  }

  const copy = igMediaStatusPresentation(status);
  if (status === "archived") {
    return {
      label: copy.label,
      className:
        "border-sky-500/25 bg-sky-500/10 text-sky-950 dark:text-sky-100",
    };
  }

  return {
    label: copy.label,
    className:
      "border-destructive/25 bg-destructive/10 text-destructive",
  };
}

function statusBadge(post: CommentPostSummary): { label: string; className: string } {
  if (post.status === "scheduled") {
    return {
      label: "Agendada",
      className:
        "border-border/60 bg-muted/80 text-muted-foreground",
    };
  }
  if (post.is_external || post.status === "monitored") {
    return {
      label: "Externa",
      className:
        "border-border/60 bg-muted/80 text-muted-foreground",
    };
  }
  return {
    label: "Publicada",
    className:
      "border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  };
}

const PostInboxItem = memo(function PostInboxItem({
  post,
  selected,
  thumbnailOverrides,
  onSelect,
}: {
  post: CommentPostSummary;
  selected: boolean;
  thumbnailOverrides?: Record<string, string | null | undefined>;
  onSelect: () => void;
}) {
  const preview = resolveThumbnail(post, thumbnailOverrides);
  const badge = statusBadge(post);
  const mediaBadge = igMediaBadge(post.ig_media_status);
  const hasEngagement = post.comments_count > 0 || post.status === "published";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 border-l-4 p-4 text-left transition-colors",
        selected
          ? "border-l-primary bg-primary/10 hover:bg-muted/40"
          : "border-l-transparent border-b border-border/50 hover:bg-muted/40",
      )}
    >
      <div className="relative size-16 shrink-0">
        {preview ? (
          <img
            src={preview}
            alt=""
            className="size-16 rounded-md border border-border/50 object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex size-16 items-center justify-center rounded-md border border-border/50 bg-muted"
          >
            <ImageIcon className="size-5 text-muted-foreground/70" />
          </div>
        )}
        {post.pending_count > 0 ? (
          <span
            className="absolute -top-1.5 -right-1.5 flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white"
          >
            {post.pending_count > 9 ? "9+" : post.pending_count}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 flex flex-col">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <span
              className={cn(
                "rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                badge.className,
              )}
            >
              {badge.label}
            </span>
            {mediaBadge ? (
              <span
                className={cn(
                  "rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  mediaBadge.className,
                )}
                title={post.ig_media_status_detail ?? undefined}
              >
                {mediaBadge.label}
              </span>
            ) : null}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatListDate(post.published_at)}
          </span>
        </div>

        <p
          className={cn(
            "truncate text-sm text-foreground",
            selected ? "font-semibold" : "font-normal",
          )}
        >
          {listCaption(post.caption)}
        </p>

        <div
          className={cn(
            "mt-1 flex items-center gap-2 text-muted-foreground",
            !hasEngagement && "opacity-0",
          )}
        >
          <span className="inline-flex items-center gap-1 text-xs">
            <Heart className="size-3.5 shrink-0" aria-hidden />
            <span className="tabular-nums">—</span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs">
            <MessageCircle className="size-3.5 shrink-0" aria-hidden />
            <span className="tabular-nums">{post.comments_count}</span>
          </span>
        </div>
      </div>
    </button>
  );
});

export function PostInboxList({
  posts,
  selectedPostId,
  thumbnailOverrides,
  onSelect,
}: PostInboxListProps) {
  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <PostInboxItem
          key={post.post_id}
          post={post}
          selected={post.post_id === selectedPostId}
          thumbnailOverrides={thumbnailOverrides}
          onSelect={() => onSelect(post.post_id)}
        />
      ))}
    </div>
  );
}
