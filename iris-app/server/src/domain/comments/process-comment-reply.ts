import type { AppContext } from "../../api/app-context.ts";
import type { MetaCommentReplier } from "../../ports/meta-comment-replier.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { AgentRun } from "../../ports/agent-run-repository.ts";
import type { Comment } from "./comment.ts";
import type { Post } from "../posts/post.ts";
import { getAppSettingsOrDefault } from "../../adapters/sqlite/app-settings-repository.ts";
import { notifyCommentsChanged } from "../../adapters/sse/event-bus.ts";
import { assembleReplyContext } from "../reply-context/reply-context-assembler.ts";
import {
  buildReplyAuditSummary,
  serializeReplyAuditSummary,
} from "../reply-context/build-reply-audit-summary.ts";
import {
  executeAndRecordHarness,
  HarnessExecutionError,
  recordFailedHarnessRun,
} from "../reply-harness/execute-and-record-harness.ts";
import { getAgentContentOrDefault } from "../settings/agent-content-defaults.ts";
import {
  resolveEffectiveReplyMode,
  shouldScheduleCommentReply,
  type ReplyMode,
} from "../posts/reply-mode.ts";
import { commentReplyLimiter } from "./comment-reply-limiter.ts";

export type ProcessCommentReplyOptions = {
  trigger: "worker" | "webhook" | "manual";
  llmCompleter?: LlmCompleter | null;
  metaCommentReplier?: MetaCommentReplier;
  replyModeOverride?: Extract<ReplyMode, "auto" | "draft">;
};

function guardrailMessage(reason: string): string {
  return `[guardrail] ${reason}`.slice(0, 500);
}

async function processCommentReplyCore(
  ctx: AppContext,
  commentId: string,
  options: ProcessCommentReplyOptions,
  deps: {
    comment: Comment;
    post: Post;
    effectiveReplyMode: ReturnType<typeof resolveEffectiveReplyMode>;
    llm: LlmCompleter;
    replier: MetaCommentReplier | undefined;
  },
): Promise<boolean> {
  const { comment, post, effectiveReplyMode, llm, replier } = deps;

  const context = await assembleReplyContext(commentId, ctx.replyContextAssembler);
  if (!context) {
    return false;
  }

  const agentContent = getAgentContentOrDefault(ctx.agentContentStore);
  const inputSummary = serializeReplyAuditSummary(buildReplyAuditSummary(context));

  let run: AgentRun;

  try {
    const recorded = await executeAndRecordHarness(
      { agentRuns: ctx.agentRuns, agentRunSteps: ctx.agentRunSteps },
      {
        trigger: options.trigger,
        commentId,
        inputSummary,
        harnessInput: {
          context,
          agentContent,
          llm,
          maxChars: context.persona.maxChars,
        },
      },
    );
    run = recorded.run;
    const harnessResult = recorded.harness;

    if (
      harnessResult.terminalStatus === "skipped_triage" ||
      harnessResult.terminalStatus === "blocked_harmful"
    ) {
      const reason = harnessResult.steps[0]?.reason ?? "blocked";
      if (comment.status !== "replied") {
        ctx.comments.markSkipped(commentId, guardrailMessage(reason));
      }
      notifyCommentsChanged({ post_id: comment.postId });
      return false;
    }

    if (harnessResult.terminalStatus === "rejected_verify" || !harnessResult.finalText) {
      const reason = harnessResult.steps.at(-1)?.reason ?? "verify_rejected";
      if (comment.status !== "replied") {
        ctx.comments.markFailed(commentId, guardrailMessage(reason));
      }
      notifyCommentsChanged({ post_id: comment.postId });
      return false;
    }

    const message = harnessResult.finalText;

    if (effectiveReplyMode === "draft") {
      ctx.comments.upsertDraft(commentId, message, { agentRunId: run.id });
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

    if (error instanceof HarnessExecutionError) {
      run = error.run;
    } else {
      run = recordFailedHarnessRun(
        { agentRuns: ctx.agentRuns },
        {
          trigger: options.trigger,
          commentId,
          inputSummary,
          errorMessage,
        },
      ).run;
    }

    ctx.comments.createReply({
      commentId,
      sentText: "",
      status: "failed",
      agentRunId: run.id,
    });
    if (comment.status !== "replied") {
      ctx.comments.markFailed(commentId, errorMessage);
    }
    notifyCommentsChanged({ post_id: comment.postId });
    return false;
  }
}

export async function processCommentReply(
  ctx: AppContext,
  commentId: string,
  options: ProcessCommentReplyOptions,
): Promise<boolean> {
  const comment = ctx.comments.findById(commentId);
  if (!comment) {
    return false;
  }

  const isManual = options.replyModeOverride != null;
  const isManualDraft = options.replyModeOverride === "draft";

  if (!isManual) {
    if (comment.status !== "pending") {
      return false;
    }

    if (ctx.comments.hasReplyRecord(commentId)) {
      return false;
    }
  } else if (isManualDraft) {
    if (comment.status === "skipped") {
      return false;
    }
  } else {
    if (comment.status !== "pending" && comment.status !== "failed") {
      return false;
    }

    const sent = ctx.comments.findLatestSentReply(commentId);
    if (sent?.sentText) {
      return false;
    }
  }

  const appSettings = getAppSettingsOrDefault(ctx.appSettingsStore);
  const post = ctx.posts.findById(comment.postId);
  if (!post) {
    return false;
  }

  const effectiveReplyMode =
    options.replyModeOverride ??
    resolveEffectiveReplyMode(appSettings.replyMode, post.replyMode);

  if (!isManual && !shouldScheduleCommentReply(effectiveReplyMode)) {
    return false;
  }

  const llm = options.llmCompleter ?? ctx.resolveLlmCompleter();
  const replier = options.metaCommentReplier ?? ctx.metaCommentReplier;

  if (!llm) {
    return false;
  }

  return commentReplyLimiter.run(() =>
    processCommentReplyCore(ctx, commentId, options, {
      comment,
      post,
      effectiveReplyMode,
      llm,
      replier,
    }),
  );
}
