import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { postPreviewUrl } from "@/hooks/use-post-preview";
import { cn } from "@/lib/utils";
import type { CommentPostSummary } from "@/lib/types";

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

function PostInboxItem({
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
  const initial = (post.caption?.trim()?.[0] ?? "P").toUpperCase();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full gap-3 rounded-xl border p-3 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-transparent bg-background hover:border-border/80 hover:bg-muted/40",
      )}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border/50">
        {preview ? (
          <img src={preview} alt="" className="size-full object-cover" loading="lazy" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center bg-linear-to-br from-violet-500/20 to-orange-400/20 text-sm font-semibold text-primary">
            {initial}
          </div>
        )}
        {post.pending_count > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow">
            {post.pending_count > 9 ? "9+" : post.pending_count}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="line-clamp-2 text-sm leading-snug font-medium group-hover:text-primary">
          {post.caption?.trim() || "(sem legenda)"}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{formatListDate(post.published_at)}</span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3" />
            {post.comments_count}
          </span>
          {post.is_external ? (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              externa
            </Badge>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export function PostInboxList({
  posts,
  selectedPostId,
  thumbnailOverrides,
  onSelect,
}: PostInboxListProps) {
  return (
    <div className="space-y-1">
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
