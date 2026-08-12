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
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  };
}

function statusBadge(post: CommentPostSummary): {
  label: string;
  className: string;
} {
  if (post.status === "scheduled") {
    return {
      label: "Agendada",
      className: "border-border/60 bg-muted/80 text-muted-foreground",
    };
  }
  if (post.is_external || post.status === "monitored") {
    return {
      label: "Externa",
      className: "border-border/60 bg-muted/80 text-muted-foreground",
    };
  }
  return {
    label: "Publicada",
    className:
      "border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  };
}

const PostFeedCard = memo(function PostFeedCard({
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
  const likeLabel =
    post.like_count == null
      ? "—"
      : new Intl.NumberFormat("pt-BR").format(post.like_count);
  const commentsLabel = new Intl.NumberFormat("pt-BR").format(
    post.comments_count,
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-(--iris-radius-lg) border border-border/70 bg-card text-left shadow-none transition-colors",
        selected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted/40",
      )}
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-muted">
        {preview ? (
          <img
            src={preview}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-8 text-muted-foreground/70" />
          </div>
        )}
        {post.pending_count > 0 ? (
          <span className="absolute top-2 right-2 flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-semibold text-white">
            {post.pending_count > 9 ? "9+" : post.pending_count}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-1.5 p-3 sm:p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <span
              className={cn(
                "rounded-sm border px-1.5 py-0.5 text-xs font-semibold leading-none",
                badge.className,
              )}
            >
              {badge.label}
            </span>
            {mediaBadge ? (
              <span
                className={cn(
                  "rounded-sm border px-1.5 py-0.5 text-xs font-semibold leading-none",
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
            "line-clamp-2 text-sm leading-snug text-foreground",
            selected ? "font-semibold" : "font-normal",
          )}
        >
          {listCaption(post.caption)}
        </p>

        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-xs">
            <Heart className="size-3.5 shrink-0" aria-hidden />
            <span className="tabular-nums">{likeLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs">
            <MessageCircle className="size-3.5 shrink-0" aria-hidden />
            <span className="tabular-nums">{commentsLabel}</span>
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
    <div className="grid min-w-0 grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {posts.map((post) => (
        <PostFeedCard
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
