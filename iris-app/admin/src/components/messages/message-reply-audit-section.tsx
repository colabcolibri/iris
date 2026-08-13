import { useCallback, useState } from "react";
import { fetchMessageReplyAudit } from "@/lib/api";
import type { ReplyAudit } from "@/lib/types";
import {
  ReplyAuditPanel,
  ReplyAuditTrigger,
} from "@/components/comments/reply-audit-section";

export function useMessageReplyAudit(messageId: string) {
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
      const data = await fetchMessageReplyAudit(messageId);
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
  }, [audit, empty, messageId, open]);

  return { open, loading, audit, empty, error, toggle };
}

export function MessageReplyAuditSection({
  messageId,
  className,
}: {
  messageId: string;
  className?: string;
}) {
  const auditState = useMessageReplyAudit(messageId);

  return (
    <div className={className}>
      <ReplyAuditTrigger
        active={auditState.open}
        onClick={() => void auditState.toggle()}
      />
      <ReplyAuditPanel {...auditState} className="mt-2" />
    </div>
  );
}
