import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchReplyAudit } from "@/lib/api";
import type { ReplyAudit } from "@/lib/types";
import { ReplyAuditTimeline } from "@/components/comments/reply-audit-timeline";

type ReplyAuditSectionProps = {
  commentId: string;
  className?: string;
};

export function ReplyAuditSection({ commentId, className }: ReplyAuditSectionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<ReplyAudit | null>(null);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAudit() {
    if (audit || empty) {
      setOpen((current) => !current);
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
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs text-primary"
        onClick={() => void loadAudit()}
      >
        {open ? <ChevronUp className="mr-1 size-3.5" /> : <ChevronDown className="mr-1 size-3.5" />}
        Ver decisão do agente
      </Button>

      {open ? (
        <div className="mt-2 rounded-xl border border-border/60 bg-background/80 p-3">
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
      ) : null}
    </div>
  );
}
