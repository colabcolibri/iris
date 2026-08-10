import { Bot, PauseCircle } from "lucide-react";
import {
  replyStatusPresentation,
  resolveEffectivePostReplyStatusFromPost,
  type PostReplyModeInput,
} from "@iris/domain/reply-effective-status";
import { cn } from "@/lib/utils";

type PostReplyStatusBadgeProps = {
  post: PostReplyModeInput;
  globalAutoReplyEnabled: boolean;
  size?: "sm" | "md";
  showHint?: boolean;
  className?: string;
};

const BADGE_STYLES = {
  auto: "border-emerald-500/35 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200",
  draft: "border-sky-500/35 bg-sky-500/12 text-sky-900 dark:text-sky-100",
  off: "border-border bg-muted/80 text-muted-foreground",
  paused: "border-amber-500/40 bg-amber-500/12 text-amber-950 dark:text-amber-100",
} as const;

export function PostReplyStatusBadge({
  post,
  globalAutoReplyEnabled,
  size = "sm",
  showHint = false,
  className,
}: PostReplyStatusBadgeProps) {
  const status = resolveEffectivePostReplyStatusFromPost(globalAutoReplyEnabled, post);
  const copy = replyStatusPresentation(status);
  const Icon = status.kind === "paused" ? PauseCircle : Bot;

  return (
    <span className={cn("inline-flex max-w-full flex-col gap-0.5", className)}>
      <span
        className={cn(
          "inline-flex max-w-full items-center gap-1 rounded-full border font-semibold",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
          BADGE_STYLES[status.kind],
        )}
        title={copy.hint ?? copy.label}
      >
        <Icon className={cn("shrink-0", size === "sm" ? "size-3" : "size-3.5")} />
        <span className="truncate">{copy.label}</span>
      </span>
      {showHint && copy.hint ? (
        <span className="text-[10px] leading-snug text-muted-foreground">{copy.hint}</span>
      ) : null}
    </span>
  );
}
