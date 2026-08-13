import { Link } from "react-router-dom";
import type { ReplyAudit, ReplyAuditStep } from "@/lib/types";
import { useAppRoutes } from "@/demo/demo-routes";
import {
  REPLY_AUDIT_BADGE_STYLES,
  REPLY_AUDIT_STAGE_LABELS,
  REPLY_AUDIT_VERDICT_LABELS,
  replyAuditStepTone,
  shouldSuggestAgentContentEdit,
} from "@/lib/reply-audit-labels";
import { cn } from "@/lib/utils";

const TERMINAL_LABELS: Record<string, string> = {
  approved: "aprovado",
  approved_simple: "aprovado (simples)",
  skipped_triage: "ignorado na triagem",
  blocked_harmful: "bloqueado (harmful)",
  rejected_verify: "rejeitado na verificação",
};

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
  return `in ${step.llm.promptTokens ?? "—"} · out ${step.llm.completionTokens ?? "—"} · total ${step.llm.totalTokens ?? "—"} · ${step.llm.latencyMs} ms`;
}

function triggerLabel(trigger: string): string {
  if (trigger === "worker") {
    return "worker";
  }
  if (trigger === "simulate") {
    return "simulador";
  }
  return trigger;
}

export function ReplyAuditTimeline({
  audit,
  className,
  summary,
  proposedReply,
  proposedReplyLanguageLabel,
}: ReplyAuditTimelineProps) {
  const routes = useAppRoutes();
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
    <div className={cn("max-w-full space-y-5", className)}>
      {proposedReply ? (
        <div className="rounded-[var(--iris-radius-lg)] border border-primary/25 bg-primary/5 p-4 sm:p-5">
          <p className="mb-2 text-xs font-semibold tracking-wide text-primary uppercase">
            Resposta proposta
            {proposedReplyLanguageLabel
              ? ` · ${proposedReplyLanguageLabel}`
              : ""}
          </p>
          <p className="font-display text-lg leading-snug whitespace-pre-wrap text-foreground sm:text-xl">
            {proposedReply}
          </p>
        </div>
      ) : null}

      <div className="rounded-[var(--iris-radius-lg)] border border-border/70 bg-muted/15 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-semibold text-foreground">
            {TERMINAL_LABELS[audit.terminal_status] ?? audit.terminal_status}
          </span>
          {audit.reply_tier ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              tier {audit.reply_tier}
            </span>
          ) : null}
          <span className="text-sm text-muted-foreground">
            via {triggerLabel(audit.trigger)}
          </span>
        </div>

        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Chamadas
            </dt>
            <dd className="mt-0.5 text-base font-semibold text-foreground">
              {audit.steps.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Modelos
            </dt>
            <dd className="mt-0.5 text-base font-semibold break-all text-foreground">
              {models.length > 0 ? models.join(", ") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Tokens
            </dt>
            <dd className="mt-0.5 text-base font-semibold text-foreground">
              {summary?.totalTokens != null
                ? `${summary.totalTokens} (${summary.totalPromptTokens ?? 0} in / ${summary.totalCompletionTokens ?? 0} out)`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Duração
            </dt>
            <dd className="mt-0.5 text-base font-semibold text-foreground">
              {durationLabel ?? "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {audit.flow_id ? (
            <span className="font-mono text-sm" title={audit.flow_id}>
              flow {audit.flow_id}
            </span>
          ) : null}
          {audit.output_summary ? (
            <span className="truncate">{audit.output_summary}</span>
          ) : null}
          {summary?.commentHref ? (
            <Link
              to={summary.commentHref}
              className="font-semibold text-primary hover:underline"
            >
              abrir thread
            </Link>
          ) : null}
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold text-foreground">
          Stages desta execução
        </h3>
        <p className="mt-1 text-base text-muted-foreground">
          Cada chamada do harness (triagem, rascunho, verificação) com modelo e
          telemetria.
        </p>
      </div>

      <ol className="space-y-3">
        {audit.steps.map((step, index) => {
          const tone = replyAuditStepTone(step);
          const tokenLine = formatTokens(step);
          return (
            <li
              key={`${step.stage}-${index}`}
              className="rounded-[var(--iris-radius-lg)] border border-border/70 bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Chamada {index + 1}
                    </span>
                    <span className="font-display text-lg font-semibold text-foreground">
                      {REPLY_AUDIT_STAGE_LABELS[step.stage]}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                        REPLY_AUDIT_BADGE_STYLES[tone],
                      )}
                    >
                      {REPLY_AUDIT_VERDICT_LABELS[step.verdict]}
                    </span>
                  </div>
                  {step.llm?.model ? (
                    <p className="font-mono text-base font-semibold break-all text-primary">
                      {step.llm.model}
                    </p>
                  ) : (
                    <p className="text-base text-muted-foreground">
                      Sem telemetria de modelo
                    </p>
                  )}
                  {tokenLine ? (
                    <p className="text-sm text-muted-foreground">{tokenLine}</p>
                  ) : null}
                </div>
                <time className="shrink-0 text-sm text-muted-foreground">
                  {new Date(step.created_at).toLocaleString("pt-BR")}
                </time>
              </div>

              {step.reason ? (
                <p className="mt-3 text-base leading-relaxed text-foreground">
                  {step.reason}
                </p>
              ) : null}

              {step.reasoning ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-primary">
                    Ver reasoning
                  </summary>
                  <pre className="mt-2 max-w-full overflow-x-auto rounded-[var(--iris-radius-sm)] bg-muted/40 p-3 font-mono text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-muted-foreground">
                    {step.reasoning}
                  </pre>
                </details>
              ) : null}

              {step.stage === "message_triage" && step.structured ? (
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {typeof step.structured.messageCategory === "string" ? (
                    <span className="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 font-medium text-foreground">
                      categoria: {step.structured.messageCategory}
                    </span>
                  ) : null}
                  {typeof step.structured.product_slug === "string" ? (
                    <span className="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 font-medium text-foreground">
                      produto: {step.structured.product_slug}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {step.structured ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-semibold text-primary">
                    Ver JSON estruturado
                  </summary>
                  <pre className="mt-2 max-w-full overflow-x-auto rounded-[var(--iris-radius-sm)] bg-muted/40 p-3 font-mono text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-muted-foreground">
                    {JSON.stringify(step.structured, null, 2)}
                  </pre>
                </details>
              ) : null}
            </li>
          );
        })}
      </ol>

      {suggestEdit ? (
        <p className="text-sm text-muted-foreground">
          Ajuste as regras em{" "}
          <Link
            to={routes.persona}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            conteúdo do agente
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
