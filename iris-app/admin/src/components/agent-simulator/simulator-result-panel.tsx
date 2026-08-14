import { ReplyAuditTimeline } from "@/components/comments/reply-audit-timeline";
import { OperatorNotificationResultCard } from "@/components/agent-simulator/operator-notification-result-card";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import type { OperatorNotificationLog } from "@/lib/api";
import type { ReplyAudit } from "@/lib/types";

type SimulatorResultPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  running: boolean;
  runningLabel: string;
  audit: ReplyAudit | null;
  finalText: string | null;
  languageLabel: string;
  emptyTitle: string;
  emptyBody: string;
  noApprovedLabel: string;
  operatorNotifications?: OperatorNotificationLog[] | null;
  operatorNotificationLabels?: {
    title: string;
    none: string;
    channel: string;
    recipient: string;
    statusSent: string;
    statusSkipped: string;
    statusFailed: string;
    error: string;
  };
};

export function SimulatorResultPanel({
  eyebrow,
  title,
  description,
  running,
  runningLabel,
  audit,
  finalText,
  languageLabel,
  emptyTitle,
  emptyBody,
  noApprovedLabel,
  operatorNotifications = null,
  operatorNotificationLabels,
}: SimulatorResultPanelProps) {
  const hasResult = Boolean(audit);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-4 py-4 sm:px-6 md:px-8">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-base text-muted-foreground">{description}</p>
      </div>
      <PageScrollArea contentClassName="p-4 sm:p-6 md:px-8">
        <div className="w-full">
          {!hasResult && !running ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <p className="font-display text-xl font-semibold text-foreground">{emptyTitle}</p>
              <p className="mt-2 max-w-sm text-base text-muted-foreground">{emptyBody}</p>
            </div>
          ) : null}

          {running ? (
            <p className="text-base text-muted-foreground">{runningLabel}</p>
          ) : null}

          {audit ? (
            <>
              {operatorNotificationLabels ? (
                <OperatorNotificationResultCard
                  notifications={operatorNotifications ?? []}
                  labels={operatorNotificationLabels}
                />
              ) : null}
              <ReplyAuditTimeline
              audit={audit}
              proposedReply={finalText}
              proposedReplyLanguageLabel={languageLabel}
              summary={{
                toolCallCount: audit.session_summary?.toolCallCount ?? null,
                totalTokens: audit.session_summary?.totalTokens ?? null,
                totalPromptTokens: audit.session_summary?.totalPromptTokens ?? null,
                totalCompletionTokens:
                  audit.session_summary?.totalCompletionTokens ?? null,
                durationMs: audit.session_summary?.durationMs ?? null,
              }}
            />
            </>
          ) : null}

          {audit && !finalText ? (
            <p className="mt-4 text-base text-muted-foreground">{noApprovedLabel}</p>
          ) : null}
        </div>
      </PageScrollArea>
    </section>
  );
}
