import type { AppContext } from "../../api/app-context.ts";
import type { MetaCommentReplier } from "../../ports/meta-comment-replier.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { AgentRunStatus } from "../../ports/agent-run-repository.ts";
import { getAppSettingsOrDefault } from "../../adapters/sqlite/app-settings-repository.ts";
import { notifyCommentsChanged } from "../../adapters/sse/event-bus.ts";
import { assembleReplyContext } from "../reply-context/reply-context-assembler.ts";
import {
  buildReplyAuditSummary,
  serializeReplyAuditSummary,
} from "../reply-context/build-reply-audit-summary.ts";
import { runReplyHarness } from "../reply-harness/orchestrator.ts";
import {
  resolveEffectiveReplyMode,
  shouldScheduleCommentReply,
} from "../reply-mode.ts";

export type ProcessCommentReplyOptions = {
  trigger: "worker" | "webhook";
  llmCompleter?: LlmCompleter | null;
  metaCommentReplier?: MetaCommentReplier;
};

function guardrailMessage(reason: string): string {
  return `[guardrail] ${reason}`.slice(0, 500);
}

function runStatusFromHarness(terminalStatus: string): AgentRunStatus {
  if (terminalStatus === "approved" || terminalStatus === "approved_simple") {
    return "ok";
  }
  if (terminalStatus === "skipped_triage" || terminalStatus === "blocked_harmful") {
    return "skipped";
  }
  return "failed";
}

export async function processCommentReply(
  ctx: AppContext,
  commentId: string,
  options: ProcessCommentReplyOptions,
): Promise<boolean> {
  const comment = ctx.comments.findById(commentId);
  if (!comment || comment.status !== "pending") {
    return false;
  }

  if (ctx.comments.hasReplyRecord(commentId)) {
    return false;
  }

  const appSettings = getAppSettingsOrDefault(ctx.appSettingsStore);
  const post = ctx.posts.findById(comment.postId);
  if (!post) {
    return false;
  }

  const effectiveReplyMode = resolveEffectiveReplyMode(
    appSettings.replyMode,
    post.replyMode,
  );

  if (!shouldScheduleCommentReply(effectiveReplyMode)) {
    return false;
  }

  const llm = options.llmCompleter ?? ctx.resolveLlmCompleter();
  const replier = options.metaCommentReplier ?? ctx.metaCommentReplier;

  if (!llm) {
    return false;
  }

  const context = await assembleReplyContext(commentId, ctx.replyContextAssembler);
  if (!context) {
    return false;
  }

  const agentContent = ctx.agentContentStore.get();
  const inputSummary = serializeReplyAuditSummary(buildReplyAuditSummary(context));

  try {
    const harnessResult = await runReplyHarness({
      context,
      agentContent,
      llm,
      maxChars: context.persona.maxChars,
    });

    const run = ctx.agentRuns.create({
      trigger: options.trigger,
      inputSummary,
      outputSummary:
        harnessResult.finalText?.slice(0, 500) ?? harnessResult.terminalStatus,
      status: runStatusFromHarness(harnessResult.terminalStatus),
    });

    if (harnessResult.steps.length > 0) {
      ctx.agentRunSteps.appendBatch(
        harnessResult.steps.map((step) => ({
          agentRunId: run.id,
          commentId,
          stage: step.stage,
          verdict: step.verdict,
          reason: step.reason,
          reasoning: step.reasoning,
          outputJson: step.structured ?? null,
        })),
      );
    }

    if (
      harnessResult.terminalStatus === "skipped_triage" ||
      harnessResult.terminalStatus === "blocked_harmful"
    ) {
      const reason = harnessResult.steps[0]?.reason ?? "blocked";
      ctx.comments.markSkipped(commentId, guardrailMessage(reason));
      notifyCommentsChanged({ post_id: comment.postId });
      return false;
    }

    if (harnessResult.terminalStatus === "rejected_verify" || !harnessResult.finalText) {
      const reason = harnessResult.steps.at(-1)?.reason ?? "verify_rejected";
      ctx.comments.markFailed(commentId, guardrailMessage(reason));
      notifyCommentsChanged({ post_id: comment.postId });
      return false;
    }

    const message = harnessResult.finalText;

    if (effectiveReplyMode === "draft") {
      ctx.comments.createReply({
        commentId,
        draftText: message,
        status: "draft",
        agentRunId: run.id,
      });
      notifyCommentsChanged({ post_id: comment.postId });
      return true;
    }

    if (!replier) {
      return false;
    }

    const publishResult = await replier.reply(comment.igCommentId, message);

    ctx.comments.createReply({
      commentId,
      sentText: message,
      status: "sent",
      agentRunId: run.id,
      replyToIgCommentId: comment.igCommentId,
      sourceIgCommentId: publishResult?.publishedIgCommentId ?? null,
    });
    ctx.comments.markReplied(commentId);
    notifyCommentsChanged({ post_id: comment.postId });
    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message.slice(0, 500) : "reply failed";

    const run = ctx.agentRuns.create({
      trigger: options.trigger,
      inputSummary,
      outputSummary: errorMessage,
      status: "failed",
    });

    ctx.comments.createReply({
      commentId,
      sentText: "",
      status: "failed",
      agentRunId: run.id,
    });
    ctx.comments.markFailed(commentId, errorMessage);
    notifyCommentsChanged({ post_id: comment.postId });
    return false;
  }
}

export function scheduleCommentReply(
  ctx: AppContext,
  commentId: string,
  options: Omit<ProcessCommentReplyOptions, "trigger"> = {},
): void {
  setImmediate(() => {
    void processCommentReply(ctx, commentId, { ...options, trigger: "webhook" });
  });
}
