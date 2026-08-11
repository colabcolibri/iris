import { Link } from "react-router-dom";
import type { ReplyAudit } from "@/lib/types";
import { ROUTES } from "@/lib/routes";
import {
  REPLY_AUDIT_BADGE_STYLES,
  REPLY_AUDIT_STAGE_LABELS,
  REPLY_AUDIT_VERDICT_LABELS,
  replyAuditStepTone,
  shouldSuggestAgentContentEdit,
} from "@/lib/reply-audit-labels";
import { cn } from "@/lib/utils";

type ReplyAuditTimelineProps = {
  audit: ReplyAudit;
  className?: string;
};

export function ReplyAuditTimeline({ audit, className }: ReplyAuditTimelineProps) {
  const suggestEdit = audit.steps.some((step) => shouldSuggestAgentContentEdit(step.reason));

  return (
    <div className={cn("max-w-full space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          Execução via{" "}
          {audit.trigger === "worker"
            ? "worker"
            : audit.trigger === "simulate"
              ? "simulador"
              : audit.trigger}
        </span>
        {audit.flow_id ? (
          <span className="font-mono text-[10px]" title="Flow ID">
            · flow {audit.flow_id.slice(0, 8)}…
          </span>
        ) : null}
        {audit.output_summary ? (
          <span className="truncate" title={audit.output_summary}>
            · {audit.output_summary}
          </span>
        ) : null}
      </div>

      <ol className="space-y-3">
        {audit.steps.map((step, index) => {
          const tone = replyAuditStepTone(step);
          return (
            <li
              key={`${step.stage}-${index}`}
              className="rounded-xl border border-border/70 bg-muted/20 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {REPLY_AUDIT_STAGE_LABELS[step.stage]}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    REPLY_AUDIT_BADGE_STYLES[tone],
                  )}
                >
                  {REPLY_AUDIT_VERDICT_LABELS[step.verdict]}
                </span>
              </div>

              {step.llm ? (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {step.llm.model} · in {step.llm.promptTokens ?? "—"} · out{" "}
                  {step.llm.completionTokens ?? "—"} · total {step.llm.totalTokens ?? "—"} ·{" "}
                  {step.llm.latencyMs} ms
                </p>
              ) : null}

              {step.reason ? (
                <p className="mt-2 text-sm text-foreground">{step.reason}</p>
              ) : null}

              {step.reasoning ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-primary">
                    Ver reasoning
                  </summary>
                  <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap wrap-break-word rounded-lg bg-background/80 p-2 text-xs leading-relaxed text-muted-foreground">
                    {step.reasoning}
                  </pre>
                </details>
              ) : null}

              {step.structured ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-primary">
                    Ver JSON estruturado
                  </summary>
                  <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap wrap-break-word rounded-lg bg-background/80 p-2 text-xs leading-relaxed text-muted-foreground">
                    {JSON.stringify(step.structured, null, 2)}
                  </pre>
                </details>
              ) : null}
            </li>
          );
        })}
      </ol>

      {suggestEdit ? (
        <p className="text-xs text-muted-foreground">
          Ajuste as regras em{" "}
          <Link to={ROUTES.admin.persona} className="font-medium text-primary underline-offset-4 hover:underline">
            conteúdo do agente
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
