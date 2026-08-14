import { useCallback, useState } from "react";
import { fetchMessageReplyAudit } from "@/lib/api";
import type { ReplyAudit } from "@/lib/types";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  ReplyAuditPanel,
  ReplyAuditTrigger,
} from "@/components/comments/reply-audit-section";

export function useMessageReplyAudit(messageId: string) {
  const { locale } = useAppLocale();
  const thread = useDomainMessages("messages").thread;
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
      setError(getApiErrorMessage(err, locale) || thread.auditFailed);
    } finally {
      setLoading(false);
    }
  }, [audit, empty, locale, messageId, open, thread.auditFailed]);

  return {
    open,
    loading,
    audit,
    empty,
    error,
    toggle,
    emptyLabel: thread.auditNoRun,
    failedLabel: thread.auditFailed,
    triggerLabel: thread.viewReasoning,
  };
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
        label={auditState.triggerLabel}
        onClick={() => void auditState.toggle()}
      />
      <ReplyAuditPanel
        {...auditState}
        className="mt-2"
      />
    </div>
  );
}
