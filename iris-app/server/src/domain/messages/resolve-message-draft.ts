import type { AppContext } from "../../api/app-context.ts";
import type { Message } from "./message.ts";

const HARNESS_STATUS_TOKENS = new Set([
  "approved",
  "approved_simple",
  "skipped_triage",
  "blocked_harmful",
  "rejected_verify",
  "in_progress",
]);

function isPublishableOutputSummary(outputSummary: string | null | undefined): boolean {
  const text = outputSummary?.trim();
  if (!text) {
    return false;
  }
  if (HARNESS_STATUS_TOKENS.has(text)) {
    return false;
  }
  return true;
}

/**
 * Recovers draft text when the harness succeeded but persisting message_replies failed
 * (legacy bug). Only applies while the message still looks "stuck" (failed/pending, no sent reply).
 */
export function recoverOrphanedMessageDraft(
  message: Message,
  ctx: AppContext,
): string | null {
  const current = ctx.messages.findById(message.id) ?? message;
  const stored = ctx.messageReplies.findLatestDraft(current.id);
  if (stored?.draftText?.trim()) {
    return null;
  }

  const sent = ctx.messageReplies.findLatestSentReply(current.id);
  if (sent?.sentText?.trim()) {
    return null;
  }

  if (current.status !== "failed") {
    return null;
  }

  const runId = ctx.agentRunSteps.findLatestRunIdByMessageId(current.id);
  if (!runId) {
    return null;
  }

  const run = ctx.agentRuns.findById(runId);
  if (!run || run.status !== "ok") {
    return null;
  }

  if (!isPublishableOutputSummary(run.outputSummary)) {
    return null;
  }

  return run.outputSummary!.trim();
}

export function resolveMessageDraftText(message: Message, ctx: AppContext): string | null {
  const current = ctx.messages.findById(message.id) ?? message;
  const stored = ctx.messageReplies.findLatestDraft(current.id);
  if (stored?.draftText?.trim()) {
    return stored.draftText.trim();
  }

  return recoverOrphanedMessageDraft(current, ctx);
}
