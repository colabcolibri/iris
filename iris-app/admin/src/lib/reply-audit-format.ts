import type { ReplyAudit, ReplyAuditStep } from "@/lib/types";

export type ReplyAuditSummaryMeta = {
  durationMs?: number | null;
  totalPromptTokens?: number | null;
  totalCompletionTokens?: number | null;
  totalTokens?: number | null;
  toolCallCount?: number | null;
  commentHref?: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function snakeToCamelKey(value: string): string {
  return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
}

export function isUuidLike(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export function parseStepReasonTags(
  reason: string | null | undefined,
): string[] {
  if (!reason?.trim()) {
    return [];
  }

  return reason
    .split(/\s*[·•|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function formatStepTokenLine(step: ReplyAuditStep): string | null {
  if (!step.llm) {
    return null;
  }

  return `${step.llm.promptTokens ?? "—"} in · ${step.llm.completionTokens ?? "—"} out`;
}

export function formatDurationMs(ms: number | null | undefined): string | null {
  if (ms == null) {
    return null;
  }
  if (ms < 1000) {
    return `${ms} ms`;
  }
  return `${(ms / 1000).toFixed(1)} s`;
}

export type ResolvedAuditMetrics = {
  callCount: number;
  models: string[];
  totalTokens: number | null;
  totalPromptTokens: number | null;
  totalCompletionTokens: number | null;
  durationMs: number | null;
  toolCallCount: number | null;
};

export function resolveAuditMetrics(
  audit: ReplyAudit,
  summary?: ReplyAuditSummaryMeta,
): ResolvedAuditMetrics {
  const session = audit.session_summary;
  const steps = audit.steps;

  const models = [
    ...new Set(
      (session?.models?.length ? session.models : steps.map((step) => step.llm?.model))
        .filter((model): model is string => Boolean(model)),
    ),
  ];

  const summedPromptTokens = steps.reduce(
    (total, step) => total + (step.llm?.promptTokens ?? 0),
    0,
  );
  const summedCompletionTokens = steps.reduce(
    (total, step) => total + (step.llm?.completionTokens ?? 0),
    0,
  );
  const summedTotalTokens = steps.reduce(
    (total, step) => total + (step.llm?.totalTokens ?? 0),
    0,
  );
  const summedLatencyMs = steps.reduce((total, step) => {
    const llmLatency = step.llm?.latencyMs ?? 0;
    const toolLatency = step.tool_latency_ms ?? 0;
    return total + llmLatency + toolLatency;
  }, 0);

  const toolCallCount =
    summary?.toolCallCount ??
    session?.toolCallCount ??
    steps.filter((step) => step.tool_name || step.stage === "tool_call").length;

  return {
    callCount:
      session?.llmCallCount ?? session?.stepCount ?? steps.length,
    models,
    totalTokens:
      summary?.totalTokens ??
      session?.totalTokens ??
      (summedTotalTokens > 0 ? summedTotalTokens : null),
    totalPromptTokens:
      summary?.totalPromptTokens ??
      session?.totalPromptTokens ??
      (summedPromptTokens > 0 ? summedPromptTokens : null),
    totalCompletionTokens:
      summary?.totalCompletionTokens ??
      session?.totalCompletionTokens ??
      (summedCompletionTokens > 0 ? summedCompletionTokens : null),
    durationMs:
      summary?.durationMs ??
      session?.durationMs ??
      session?.totalLatencyMs ??
      (summedLatencyMs > 0 ? summedLatencyMs : null),
    toolCallCount: toolCallCount > 0 ? toolCallCount : null,
  };
}

export function getStepPreviewText(step: ReplyAuditStep): string | null {
  const reasoning = step.reasoning?.trim();
  if (reasoning) {
    return reasoning;
  }

  const tags = parseStepReasonTags(step.reason);
  if (tags.length > 0) {
    return null;
  }

  const reason = step.reason?.trim();
  return reason || null;
}
