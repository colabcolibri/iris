import type { ReplyAuditStep } from "@/lib/types";

export const REPLY_AUDIT_STAGE_LABELS: Record<string, string> = {
  triage: "Triagem",
  draft: "Rascunho",
  verify: "Verificação",
  message_triage: "Triagem DM",
  message_draft: "Rascunho DM",
  message_verify: "Verificação DM",
};

export const REPLY_AUDIT_VERDICT_LABELS: Record<
  ReplyAuditStep["verdict"],
  string
> = {
  pass: "Aprovado",
  fail: "Reprovado",
  skip: "Ignorado",
};

type AuditBadgeTone = "pass" | "fail-triage" | "fail-verify" | "draft";

export function replyAuditStepTone(step: ReplyAuditStep): AuditBadgeTone {
  if (
    (step.stage === "draft" || step.stage === "message_draft") &&
    step.verdict === "pass"
  ) {
    return "draft";
  }
  if (step.verdict === "pass") {
    return "pass";
  }
  if (step.stage === "verify" || step.stage === "message_verify") {
    return "fail-verify";
  }
  return "fail-triage";
}

export const REPLY_AUDIT_BADGE_STYLES: Record<AuditBadgeTone, string> = {
  pass: "border-emerald-500/35 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200",
  draft: "border-sky-500/35 bg-sky-500/12 text-sky-900 dark:text-sky-100",
  "fail-triage":
    "border-amber-500/40 bg-amber-500/12 text-amber-950 dark:text-amber-100",
  "fail-verify": "border-destructive/40 bg-destructive/10 text-destructive",
};

export function shouldSuggestAgentContentEdit(
  reason: string | null | undefined,
): boolean {
  if (!reason) {
    return false;
  }
  const normalized = reason.toLowerCase();
  return normalized.includes("restriction") || normalized.includes("guardrail");
}
