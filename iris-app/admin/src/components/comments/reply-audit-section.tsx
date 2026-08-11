import { useCallback, useState } from "react";
import { BrainCircuit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fetchReplyAudit } from "@/lib/api";
import type { ReplyAudit } from "@/lib/types";
import { ReplyAuditTimeline } from "@/components/comments/reply-audit-timeline";

export function useReplyAudit(commentId: string) {
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
      setError(err instanceof Error ? err.message : "Falha ao carregar audit.");
    } finally {
      setLoading(false);
    }
  }, [audit, commentId, empty, open]);

  return { open, loading, audit, empty, error, toggle };
}

type ReplyAuditTriggerProps = {
  active?: boolean;
  className?: string;
  onClick: () => void;
};

export function ReplyAuditTrigger({
  active = false,
  className,
  onClick,
}: ReplyAuditTriggerProps) {
  return (
    <button
      type="button"
      className={cn(
        "shrink-0 rounded-md p-1.5 text-primary/80 transition-colors hover:bg-primary/10 hover:text-primary",
        active && "bg-primary/15 text-primary",
        className,
      )}
      aria-label="Ver decisão do agente"
      title="Ver decisão do agente"
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
};

export function ReplyAuditPanel({
  open,
  loading,
  audit,
  empty,
  error,
  className,
}: ReplyAuditPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-[var(--iris-radius-lg)] border border-border/60 bg-background/90 p-3",
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
        <p className="text-sm text-destructive">{error}</p>
      ) : empty ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma execução do agente para este comentário.
        </p>
      ) : audit ? (
        <ReplyAuditTimeline audit={audit} />
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
