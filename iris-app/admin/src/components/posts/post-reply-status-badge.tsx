import { Bot } from "lucide-react";
import {
  replyStatusPresentation,
  resolveEffectivePostReplyStatusFromPost,
  type PostReplyModeInput,
} from "@iris/domain/reply-effective-status";
import type { ReplyMode } from "@iris/domain/reply-mode";
import { cn } from "@/lib/utils";

type PostReplyStatusBadgeProps = {
  post: PostReplyModeInput;
  globalReplyMode: ReplyMode;
  size?: "sm" | "md";
  showHint?: boolean;
  className?: string;
};

const BADGE_STYLES = {
  auto: "border-emerald-500/35 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200",
  draft: "border-sky-500/35 bg-sky-500/12 text-sky-900 dark:text-sky-100",
  off: "border-border bg-muted/80 text-muted-foreground",
} as const;

export function PostReplyStatusBadge({
  post,
  globalReplyMode,
  size = "sm",
  showHint = false,
  className,
}: PostReplyStatusBadgeProps) {
  const status = resolveEffectivePostReplyStatusFromPost(globalReplyMode, post);
  const copy = replyStatusPresentation(status);

  return (
    <span className={cn("inline-flex max-w-full flex-col gap-0.5", className)}>
      <span
        className={cn(
          "inline-flex max-w-full items-center gap-1 rounded-full border font-semibold",
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
          BADGE_STYLES[status.kind],
        )}
        title={copy.hint ?? copy.label}
      >
        <Bot
          className={cn("shrink-0", size === "sm" ? "size-3" : "size-3.5")}
        />
        <span className="truncate">{copy.label}</span>
      </span>
      {showHint && copy.hint ? (
        <span className="text-xs leading-snug text-muted-foreground">
          {copy.hint}
        </span>
      ) : null}
    </span>
  );
}
