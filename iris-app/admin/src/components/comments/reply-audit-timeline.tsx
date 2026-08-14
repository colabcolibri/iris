import { useState } from "react";
import { ChevronDown, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { interpolate } from "@/i18n/compose";
import {
  getReplyAuditStageLabel,
  getReplyAuditVerdictLabel,
} from "@/i18n/domains/labels/helpers";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import type { ReplyAudit, ReplyAuditStep } from "@/lib/types";
import { useAppRoutes } from "@/demo/demo-routes";
import {
  REPLY_AUDIT_BADGE_STYLES,
  replyAuditStepTone,
  replyAuditTerminalBadgeClass,
  replyAuditTimelineDotClass,
  shouldSuggestAgentContentEdit,
} from "@/lib/reply-audit-labels";
import {
  formatDurationMs,
  formatStepTokenLine,
  getStepPreviewText,
  isUuidLike,
  parseStepReasonTags,
  resolveAuditMetrics,
  snakeToCamelKey,
  type ReplyAuditSummaryMeta,
} from "@/lib/reply-audit-format";
import { cn } from "@/lib/utils";
import { formatCommentExactTime } from "@/lib/build-comment-tree";
import { formatRelativeTimeAgo } from "@/lib/format-relative-time";

export type { ReplyAuditSummaryMeta };

type ReplyAuditTimelineProps = {
  audit: ReplyAudit;
  className?: string;
  summary?: ReplyAuditSummaryMeta;
  proposedReply?: string | null;
  proposedReplyLanguageLabel?: string | null;
};

function getTerminalLabel(
  status: string,
  labels: Record<string, string>,
): string {
  const camelKey = snakeToCamelKey(status);
  return labels[camelKey] ?? labels[status] ?? status;
}

function getTierLabel(
  tier: string | null | undefined,
  labels: Record<string, string>,
): string | null {
  if (!tier || tier === "none") {
    return null;
  }
  return labels[tier] ?? tier;
}

async function copyRunId(value: string, copiedLabel: string) {
  await navigator.clipboard.writeText(value);
  toast.success(copiedLabel);
}

function ReplyTextBlock({
  label,
  languageLabel,
  text,
}: {
  label: string;
  languageLabel?: string | null;
  text: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-primary/25 bg-primary/5 px-3 py-3 sm:px-4">
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">
        {label}
        {languageLabel ? ` · ${languageLabel}` : ""}
      </p>
      <p className="mt-2 text-base leading-relaxed wrap-break-word whitespace-pre-wrap text-foreground">
        {text}
      </p>
    </div>
  );
}

function AuditResultHeader({
  audit,
}: {
  audit: ReplyAudit;
}) {
  const auditMessages = useDomainMessages("comments").audit;
  const threadMessages = useDomainMessages("comments").thread;
  const terminalLabel = getTerminalLabel(
    audit.terminal_status,
    auditMessages.terminal,
  );
  const tierLabel = getTierLabel(audit.reply_tier, auditMessages.tier);

  const triggerKey =
    audit.trigger === "worker"
      ? "worker"
      : audit.trigger === "simulate"
        ? "simulator"
        : null;
  const triggerText = triggerKey
    ? auditMessages.trigger[triggerKey]
    : audit.trigger;

  const showFlowId = audit.flow_id && !isUuidLike(audit.flow_id);
  const showRunId = audit.agent_run_id || (audit.flow_id && isUuidLike(audit.flow_id));
  const runId = audit.agent_run_id || audit.flow_id;

  return (
    <div className="min-w-0 space-y-3 rounded-lg border border-border/60 bg-card px-3 py-3 sm:px-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            replyAuditTerminalBadgeClass(audit.terminal_status),
          )}
        >
          {terminalLabel}
        </span>
        {tierLabel ? (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {tierLabel}
          </span>
        ) : null}
        {showFlowId ? (
          <span className="rounded-full border border-border/60 bg-muted/20 px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
            {audit.flow_id}
          </span>
        ) : null}
        <span className="text-sm text-muted-foreground">
          {interpolate(auditMessages.via, { trigger: triggerText })}
        </span>
      </div>

      {showRunId && runId ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {auditMessages.runId}
          </span>
          <code className="min-w-0 flex-1 truncate rounded-md bg-muted/30 px-2 py-1 font-mono text-xs text-muted-foreground">
            {runId}
          </code>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
            onClick={() =>
              void copyRunId(runId, auditMessages.copiedRunId).catch(() => {
                toast.error(threadMessages.copyFailed);
              })
            }
          >
            <Copy className="size-3.5" />
            {auditMessages.copyRunId}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AuditMetricsBar({
  audit,
  summary,
}: {
  audit: ReplyAudit;
  summary?: ReplyAuditSummaryMeta;
}) {
  const auditMessages = useDomainMessages("comments").audit;
  const metrics = resolveAuditMetrics(audit, summary);
  const durationLabel = formatDurationMs(metrics.durationMs);

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border/60 bg-muted/15 px-3 py-3 sm:px-4">
      <dl className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">
            {auditMessages.calls}
          </dt>
          <dd className="text-base font-semibold text-foreground tabular-nums">
            {metrics.callCount}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">
            {auditMessages.tokens}
          </dt>
          <dd className="text-base font-semibold text-foreground tabular-nums">
            {metrics.totalTokens != null ? metrics.totalTokens : "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">
            {auditMessages.duration}
          </dt>
          <dd className="text-base font-semibold text-foreground tabular-nums">
            {durationLabel ?? "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">
            {auditMessages.tools}
          </dt>
          <dd className="text-base font-semibold text-foreground tabular-nums">
            {metrics.toolCallCount != null ? metrics.toolCallCount : "—"}
          </dd>
        </div>
      </dl>

      {metrics.models.length > 0 ? (
        <p className="mt-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <span className="font-medium">{auditMessages.models}: </span>
          <span className="font-mono text-foreground">{metrics.models.join(", ")}</span>
        </p>
      ) : null}

      {summary?.commentHref ? (
        <p className="mt-3 border-t border-border/40 pt-3 text-sm">
          <Link
            to={summary.commentHref}
            className="font-medium text-primary hover:underline"
          >
            {auditMessages.openThread}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function ToolStepDetail({ step }: { step: ReplyAuditStep }) {
  const auditMessages = useDomainMessages("comments").audit;
  const hasToolPayload =
    step.tool_name ||
    step.tool_input ||
    step.tool_output !== undefined ||
    step.tool_latency_ms != null;

  if (!hasToolPayload) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-md border border-border/50 bg-muted/20 p-3">
      {step.tool_name ? (
        <p className="text-sm font-medium text-foreground">
          {interpolate(auditMessages.toolLabel, { name: step.tool_name })}
        </p>
      ) : null}
      {step.tool_input ? (
        <pre className="max-w-full overflow-x-auto font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap text-muted-foreground">
          {JSON.stringify(step.tool_input, null, 2)}
        </pre>
      ) : null}
      {step.tool_output !== undefined ? (
        <pre className="max-w-full overflow-x-auto font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap text-muted-foreground">
          {JSON.stringify(step.tool_output, null, 2)}
        </pre>
      ) : null}
      {step.tool_latency_ms != null ? (
        <p className="text-xs text-muted-foreground">
          {interpolate(auditMessages.toolLatency, { ms: step.tool_latency_ms })}
        </p>
      ) : null}
    </div>
  );
}

function StageStepContent({ step }: { step: ReplyAuditStep }) {
  const auditMessages = useDomainMessages("comments").audit;
  const [detailTab, setDetailTab] = useState<"reasoning" | "json" | null>(null);

  return (
    <div className="space-y-3 border-t border-border/50 px-3 py-3 sm:px-4">
      {step.reason ? (
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {parseStepReasonTags(step.reason).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-border/60 bg-muted/25 px-2 py-0.5 font-mono text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {step.reasoning ? (
        <p className="text-base leading-relaxed wrap-break-word text-foreground">
          {step.reasoning}
        </p>
      ) : null}

      {step.stage === "message_triage" && step.structured ? (
        <div className="flex min-w-0 flex-wrap gap-2">
          {typeof step.structured.messageCategory === "string" ? (
            <span className="rounded-md border border-border/60 bg-muted/25 px-2.5 py-1 text-sm text-foreground">
              {interpolate(auditMessages.category, {
                value: step.structured.messageCategory,
              })}
            </span>
          ) : null}
          {typeof step.structured.product_slug === "string" ? (
            <span className="rounded-md border border-border/60 bg-muted/25 px-2.5 py-1 text-sm text-foreground">
              {interpolate(auditMessages.product, {
                value: step.structured.product_slug,
              })}
            </span>
          ) : null}
        </div>
      ) : null}

      <ToolStepDetail step={step} />

      {step.turn_index != null && step.stage === "message_draft_turn" ? (
        <span className="inline-flex rounded-md border border-border/60 bg-muted/25 px-2.5 py-1 text-sm text-foreground">
          {interpolate(auditMessages.draftTurn, { index: step.turn_index })}
        </span>
      ) : null}

      {step.reasoning || step.structured || step.tool_input || step.tool_output !== undefined ? (
        <div className="flex min-w-0 flex-wrap gap-2">
          {step.reasoning ? (
            <button
              type="button"
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                detailTab === "reasoning"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 bg-background text-muted-foreground hover:text-foreground",
              )}
              onClick={() =>
                setDetailTab((current) =>
                  current === "reasoning" ? null : "reasoning",
                )
              }
            >
              {auditMessages.detailTabs.reasoning}
            </button>
          ) : null}
          {step.structured ? (
            <button
              type="button"
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                detailTab === "json"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 bg-background text-muted-foreground hover:text-foreground",
              )}
              onClick={() =>
                setDetailTab((current) => (current === "json" ? null : "json"))
              }
            >
              {auditMessages.detailTabs.json}
            </button>
          ) : null}
        </div>
      ) : null}

      {detailTab === "reasoning" && step.reasoning ? (
        <pre className="max-w-full overflow-x-auto rounded-md bg-muted/35 p-3 font-mono text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-muted-foreground">
          {step.reasoning}
        </pre>
      ) : null}

      {detailTab === "json" && step.structured ? (
        <pre className="max-w-full overflow-x-auto rounded-md bg-muted/35 p-3 font-mono text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-muted-foreground">
          {JSON.stringify(step.structured, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

function ReplyAuditStagesTimeline({ steps }: { steps: ReplyAuditStep[] }) {
  const { locale } = useAppLocale();
  const auditMessages = useDomainMessages("comments").audit;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-w-0 space-y-3">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {interpolate(auditMessages.stagesHeader, { count: steps.length })}
      </p>

      <ol className="min-w-0 space-y-0">
        {steps.map((step, index) => {
          const tone = replyAuditStepTone(step);
          const tokenLine = formatStepTokenLine(step);
          const previewText = getStepPreviewText(step);
          const reasonTags = parseStepReasonTags(step.reason);
          const isOpen = openIndex === index;
          const latencyLabel = formatDurationMs(step.llm?.latencyMs);
          const relativeTime = formatRelativeTimeAgo(step.created_at, locale);
          const exactTime = formatCommentExactTime(step.created_at, locale);

          return (
            <li
              key={`${step.stage}-${index}`}
              className="relative min-w-0 pl-6 pb-4 last:pb-0"
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-3 left-0 size-2.5 rounded-full border-2",
                  replyAuditTimelineDotClass(tone),
                )}
              />
              {index < steps.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-5 left-1 h-[calc(100%-0.5rem)] w-px bg-border/70"
                />
              ) : null}

              <div className="min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card">
                <button
                  type="button"
                  className="flex w-full min-w-0 flex-col gap-2 px-3 py-3 text-left transition-colors hover:bg-muted/20 sm:px-4"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-semibold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="text-base font-semibold text-foreground">
                          {getReplyAuditStageLabel(step.stage, locale)}
                          {step.tool_name ? ` · ${step.tool_name}` : ""}
                        </span>
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                            REPLY_AUDIT_BADGE_STYLES[tone],
                          )}
                        >
                          {getReplyAuditVerdictLabel(step.verdict, locale)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {latencyLabel ? (
                        <span className="text-xs font-medium text-foreground tabular-nums">
                          {latencyLabel}
                        </span>
                      ) : null}
                      <time
                        className="hidden text-xs text-muted-foreground sm:inline"
                        dateTime={step.created_at}
                        title={exactTime}
                      >
                        {relativeTime || exactTime}
                      </time>
                      <ChevronDown
                        className={cn(
                          "size-4 text-muted-foreground transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </div>
                  </div>

                  {!isOpen && previewText ? (
                    <p className="line-clamp-2 text-sm leading-relaxed wrap-break-word text-muted-foreground">
                      {previewText}
                    </p>
                  ) : null}

                  {!isOpen && reasonTags.length > 0 ? (
                    <div className="flex min-w-0 flex-wrap gap-1.5">
                      {reasonTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-border/60 bg-muted/20 px-2 py-0.5 font-mono text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {step.llm?.model ? (
                      <span className="font-mono break-all">{step.llm.model}</span>
                    ) : null}
                    {tokenLine ? <span className="tabular-nums">{tokenLine}</span> : null}
                    <time
                      className="text-xs text-muted-foreground sm:hidden"
                      dateTime={step.created_at}
                      title={exactTime}
                    >
                      {relativeTime || exactTime}
                    </time>
                  </div>
                </button>

                {isOpen ? <StageStepContent step={step} /> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ReplyAuditTimeline({
  audit,
  className,
  summary,
  proposedReply,
  proposedReplyLanguageLabel,
}: ReplyAuditTimelineProps) {
  const routes = useAppRoutes();
  const auditMessages = useDomainMessages("comments").audit;
  const suggestEdit = audit.steps.some((step) =>
    shouldSuggestAgentContentEdit(step.reason),
  );

  const explicitReply = proposedReply?.trim() || null;
  const outputSummary = audit.output_summary?.trim() || null;
  const replyText = explicitReply ?? outputSummary;
  const replyLabel = explicitReply
    ? auditMessages.proposedReply
    : auditMessages.generatedReply;

  return (
    <div
      className={cn("min-w-0 max-w-full space-y-4 overflow-hidden", className)}
    >
      <AuditResultHeader audit={audit} />

      {replyText ? (
        <ReplyTextBlock
          label={replyLabel}
          languageLabel={proposedReplyLanguageLabel}
          text={replyText}
        />
      ) : null}

      <AuditMetricsBar audit={audit} summary={summary} />

      <ReplyAuditStagesTimeline steps={audit.steps} />

      {suggestEdit ? (
        <p className="text-base wrap-break-word text-muted-foreground">
          {auditMessages.suggestEditPrefix}{" "}
          <Link
            to={routes.persona}
            className="font-medium text-primary hover:underline"
          >
            {auditMessages.suggestEditLink}
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
