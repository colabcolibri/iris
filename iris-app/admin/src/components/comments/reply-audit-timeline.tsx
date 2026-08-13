import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
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
  shouldSuggestAgentContentEdit,
} from "@/lib/reply-audit-labels";
import { cn } from "@/lib/utils";
import { formatCommentExactTime } from "@/lib/build-comment-tree";

export type ReplyAuditSummaryMeta = {
  durationMs?: number | null;
  totalPromptTokens?: number | null;
  totalCompletionTokens?: number | null;
  totalTokens?: number | null;
  commentHref?: string | null;
};

type ReplyAuditTimelineProps = {
  audit: ReplyAudit;
  className?: string;
  summary?: ReplyAuditSummaryMeta;
  proposedReply?: string | null;
  proposedReplyLanguageLabel?: string | null;
};

function formatDuration(ms: number | null | undefined): string | null {
  if (ms == null) {
    return null;
  }
  if (ms < 1000) {
    return `${ms} ms`;
  }
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatTokens(step: ReplyAuditStep): string | null {
  if (!step.llm) {
    return null;
  }
  return `${step.llm.promptTokens ?? "—"} in · ${step.llm.completionTokens ?? "—"} out · ${step.llm.latencyMs} ms`;
}

function AuditSummaryBar({
  audit,
  summary,
  durationLabel,
  models,
}: {
  audit: ReplyAudit;
  summary?: ReplyAuditSummaryMeta;
  durationLabel: string | null;
  models: string[];
}) {
  const auditMessages = useDomainMessages("comments").audit;

  const terminalLabel =
    auditMessages.terminal[
      audit.terminal_status as keyof typeof auditMessages.terminal
    ] ?? audit.terminal_status;

  const triggerKey =
    audit.trigger === "worker"
      ? "worker"
      : audit.trigger === "simulate"
        ? "simulator"
        : null;
  const triggerText = triggerKey
    ? auditMessages.trigger[triggerKey]
    : audit.trigger;

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border/60 bg-muted/15 px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-semibold text-foreground">
          {terminalLabel}
        </span>
        {audit.reply_tier ? (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            tier {audit.reply_tier}
          </span>
        ) : null}
        <span className="text-sm text-muted-foreground">
          {interpolate(auditMessages.via, { trigger: triggerText })}
        </span>
      </div>

      <dl className="mt-3 grid min-w-0 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">
            {auditMessages.calls}
          </dt>
          <dd className="text-base font-semibold text-foreground">
            {audit.steps.length}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">
            {auditMessages.models}
          </dt>
          <dd className="text-base font-semibold break-all text-foreground">
            {models.length > 0 ? models.join(", ") : "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">
            {auditMessages.tokens}
          </dt>
          <dd className="text-base font-semibold text-foreground">
            {summary?.totalTokens != null ? summary.totalTokens : "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">
            {auditMessages.duration}
          </dt>
          <dd className="text-base font-semibold text-foreground">
            {durationLabel ?? "—"}
          </dd>
        </div>
      </dl>

      {audit.flow_id || audit.output_summary || summary?.commentHref ? (
        <div className="mt-3 space-y-1 border-t border-border/40 pt-3 text-base leading-relaxed text-muted-foreground">
          {audit.flow_id ? (
            <p className="break-all font-mono text-xs">{audit.flow_id}</p>
          ) : null}
          {audit.output_summary ? (
            <p className="break-words text-foreground">{audit.output_summary}</p>
          ) : null}
          {summary?.commentHref ? (
            <Link
              to={summary.commentHref}
              className="inline-block font-medium text-primary hover:underline"
            >
              {auditMessages.openThread}
            </Link>
          ) : null}
        </div>
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
        <p className="text-base leading-relaxed break-words text-foreground">
          {step.reason}
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

      {step.reasoning || step.structured ? (
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
        <pre className="max-w-full overflow-x-auto rounded-md bg-muted/35 p-3 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-muted-foreground">
          {step.reasoning}
        </pre>
      ) : null}

      {detailTab === "json" && step.structured ? (
        <pre className="max-w-full overflow-x-auto rounded-md bg-muted/35 p-3 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-muted-foreground">
          {JSON.stringify(step.structured, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

function ReplyAuditStagesAccordion({ steps }: { steps: ReplyAuditStep[] }) {
  const { locale } = useAppLocale();
  const auditMessages = useDomainMessages("comments").audit;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-w-0 space-y-2">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {interpolate(auditMessages.stagesHeader, { count: steps.length })}
      </p>

      <ol className="min-w-0 space-y-1.5">
        {steps.map((step, index) => {
          const tone = replyAuditStepTone(step);
          const tokenLine = formatTokens(step);
          const isOpen = openIndex === index;

          return (
            <li
              key={`${step.stage}-${index}`}
              className="min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card"
            >
              <button
                type="button"
                className="flex w-full min-w-0 items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/20 sm:px-4"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span className="mt-0.5 shrink-0 text-sm font-semibold text-muted-foreground">
                  #{index + 1}
                </span>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-base font-semibold text-foreground">
                      {getReplyAuditStageLabel(step.stage, locale)}
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

                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
                    {step.llm?.model ? (
                      <span className="text-base font-medium break-all text-primary">
                        {step.llm.model}
                      </span>
                    ) : null}
                    {tokenLine ? (
                      <span className="text-muted-foreground">{tokenLine}</span>
                    ) : null}
                    {step.reason && !isOpen ? (
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">
                        {step.reason}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={step.created_at}
                    title={formatCommentExactTime(step.created_at)}
                  >
                    {formatCommentExactTime(step.created_at)}
                  </time>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </div>
              </button>

              {isOpen ? <StageStepContent step={step} /> : null}
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
  const durationLabel = formatDuration(summary?.durationMs);
  const models = [
    ...new Set(
      audit.steps
        .map((step) => step.llm?.model)
        .filter((model): model is string => Boolean(model)),
    ),
  ];

  return (
    <div
      className={cn("min-w-0 max-w-full space-y-4 overflow-hidden", className)}
    >
      {proposedReply ? (
        <div className="min-w-0 overflow-hidden rounded-lg border border-primary/25 bg-primary/5 px-3 py-3 sm:px-4">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            {auditMessages.proposedReply}
            {proposedReplyLanguageLabel
              ? ` · ${proposedReplyLanguageLabel}`
              : ""}
          </p>
          <p className="mt-2 text-base leading-relaxed break-words whitespace-pre-wrap text-foreground">
            {proposedReply}
          </p>
        </div>
      ) : null}

      <AuditSummaryBar
        audit={audit}
        summary={summary}
        durationLabel={durationLabel}
        models={models}
      />

      <ReplyAuditStagesAccordion steps={audit.steps} />

      {suggestEdit ? (
        <p className="text-base break-words text-muted-foreground">
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
