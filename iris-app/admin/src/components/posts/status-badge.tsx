import { cn } from "@/lib/utils";
import { POST_STATUS_LABELS } from "@/lib/status";
import type { PostStatus } from "@/lib/types";

const VARIANTS: Record<PostStatus, string> = {
  draft: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  scheduled: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  monitored: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  cancelled: "bg-muted text-muted-foreground",
};

type StatusBadgeProps = {
  status: PostStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        VARIANTS[status],
        className,
      )}
    >
      {POST_STATUS_LABELS[status]}
    </span>
  );
}
