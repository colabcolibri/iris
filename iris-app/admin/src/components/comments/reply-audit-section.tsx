import { useCallback, useState } from "react";
import { BrainCircuit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { fetchReplyAudit } from "@/lib/api";
import type { ReplyAudit } from "@/lib/types";
import { ReplyAuditTimeline } from "@/components/comments/reply-audit-timeline";

export function useReplyAudit(commentId: string) {
  const { locale } = useAppLocale();
  const thread = useDomainMessages("comments").thread;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<ReplyAudit | null>(null);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(async () => {
    if (open) {
      setOpen(false);
      return;
    }

    if (audit || empty) {
      setOpen(true);
      return;
    }

    setOpen(true);
    setLoading(true);
    setError(null);

    try {
      const data = await fetchReplyAudit(commentId);
      if (!data) {
        setEmpty(true);
      } else {
        setAudit(data);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, locale) || thread.auditFailed);
    } finally {
      setLoading(false);
    }
  }, [audit, commentId, empty, locale, open, thread.auditFailed]);

  return { open, loading, audit, empty, error, toggle };
}

type ReplyAuditTriggerProps = {
  active?: boolean;
  className?: string;
  onClick: () => void;
  label?: string;
};

export function ReplyAuditTrigger({
  active = false,
  className,
  onClick,
  label,
}: ReplyAuditTriggerProps) {
  const thread = useDomainMessages("comments").thread;
  const resolvedLabel = label ?? thread.viewAudit;

  return (
    <button
      type="button"
      className={cn(
        "shrink-0 rounded-md p-1.5 text-primary/80 transition-colors hover:bg-primary/10 hover:text-primary",
        active && "bg-primary/15 text-primary",
        className,
      )}
      aria-label={resolvedLabel}
      title={resolvedLabel}
      onClick={onClick}
    >
      <BrainCircuit className="size-3.5" />
    </button>
  );
}

type ReplyAuditPanelProps = {
  open: boolean;
  loading: boolean;
  audit: ReplyAudit | null;
  empty: boolean;
  error: string | null;
  className?: string;
  proposedReply?: string | null;
  proposedReplyLanguageLabel?: string | null;
  emptyLabel?: string;
  failedLabel?: string;
};

export function ReplyAuditPanel({
  open,
  loading,
  audit,
  empty,
  error,
  className,
  proposedReply,
  proposedReplyLanguageLabel,
  emptyLabel,
  failedLabel,
}: ReplyAuditPanelProps) {
  const thread = useDomainMessages("comments").thread;
  const resolvedEmptyLabel = emptyLabel ?? thread.auditNoRun;
  const resolvedFailedLabel = failedLabel ?? thread.auditFailed;

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "min-w-0 max-w-full overflow-hidden rounded-md border border-border/50 bg-muted/10 p-2",
        className,
      )}
    >
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error || resolvedFailedLabel}</p>
      ) : empty ? (
        <p className="text-sm text-muted-foreground">{resolvedEmptyLabel}</p>
      ) : audit ? (
        <ReplyAuditTimeline
          audit={audit}
          proposedReply={proposedReply}
          proposedReplyLanguageLabel={proposedReplyLanguageLabel}
          summary={{
            toolCallCount: audit.session_summary?.toolCallCount ?? null,
            totalTokens: audit.session_summary?.totalTokens ?? null,
            totalPromptTokens: audit.session_summary?.totalPromptTokens ?? null,
            totalCompletionTokens: audit.session_summary?.totalCompletionTokens ?? null,
            durationMs: audit.session_summary?.durationMs ?? null,
          }}
        />
      ) : null}
    </div>
  );
}

/** @deprecated Prefer useReplyAudit + ReplyAuditTrigger + ReplyAuditPanel */
export function ReplyAuditSection({
  commentId,
  className,
}: {
  commentId: string;
  className?: string;
}) {
  const auditState = useReplyAudit(commentId);

  return (
    <div className={className}>
      <ReplyAuditTrigger
        active={auditState.open}
        onClick={() => void auditState.toggle()}
      />
      <ReplyAuditPanel {...auditState} className="mt-3" />
    </div>
  );
}
