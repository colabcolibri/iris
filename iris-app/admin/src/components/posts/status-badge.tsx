import { cn } from "@/lib/utils";
import { POST_STATUS_LABELS } from "@/lib/status";
import type { PostStatus } from "@/lib/types";

const STATUS_META: Record<PostStatus, { pill: string; dot: string; ring: string }> = {
  draft: {
    pill: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
    dot: "bg-stone-500",
    ring: "ring-stone-400/45",
  },
  scheduled: {
    pill: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
    dot: "bg-violet-600 dark:bg-violet-400",
    ring: "ring-violet-500/35",
  },
  published: {
    pill: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    dot: "bg-emerald-600 dark:bg-emerald-400",
    ring: "ring-emerald-500/35",
  },
  monitored: {
    pill: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    dot: "bg-amber-600 dark:bg-amber-400",
    ring: "ring-amber-500/35",
  },
  failed: {
    pill: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    dot: "bg-red-600 dark:bg-red-400",
    ring: "ring-red-500/35",
  },
  cancelled: {
    pill: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/80",
    ring: "ring-border",
  },
};

type StatusBadgeProps = {
  status: PostStatus;
  className?: string;
  /** Pill compacto para listas e kanban. */
  size?: "sm";
  /** Indicador de status (dot + label), não interativo. */
  variant?: "badge" | "signal";
};

export function StatusBadge({
  status,
  className,
  size: _size = "sm",
  variant = "badge",
}: StatusBadgeProps) {
  const meta = STATUS_META[status];
  const label = POST_STATUS_LABELS[status];

  if (variant === "signal") {
    return (
      <span
        className={cn(
          "inline-flex max-w-full select-none items-center gap-2 pointer-events-none",
          className,
        )}
        aria-label={`Status: ${label}`}
      >
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-background",
            meta.dot,
            meta.ring,
          )}
          aria-hidden
        />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        meta.pill,
        className,
      )}
    >
      {label}
    </span>
  );
}
