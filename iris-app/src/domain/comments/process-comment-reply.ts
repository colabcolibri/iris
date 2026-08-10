import type { AppContext } from "../../api/app-context.ts";
import type { MetaCommentReplier } from "../../ports/meta-comment-replier.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { ReplyMode } from "../reply-mode.ts";
import { generateReply } from "../../agents/reply-agent.ts";
import { notifyCommentsChanged } from "../../adapters/sse/event-bus.ts";
import { assembleReplyContext } from "../reply-context/reply-context-assembler.ts";
import {
  buildReplyAuditSummary,
  serializeReplyAuditSummary,
} from "../reply-context/build-reply-audit-summary.ts";

export type ProcessCommentReplyOptions = {
  trigger: "worker" | "webhook";
  llmCompleter?: LlmCompleter | null;
  metaCommentReplier?: MetaCommentReplier;
};

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

  const post = ctx.posts.findById(comment.postId);
  if (!post || post.replyMode === "off") {
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

  const inputSummary = serializeReplyAuditSummary(buildReplyAuditSummary(context));

  try {
    const message = await generateReply(
      { llm, assembler: ctx.replyContextAssembler },
      { prebuiltContext: context },
    );

    if (post.replyMode === "draft") {
      const run = ctx.agentRuns.create({
        trigger: options.trigger,
        inputSummary,
        outputSummary: message.slice(0, 500),
        status: "ok",
      });

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

    await replier.reply(comment.igCommentId, message);

    const run = ctx.agentRuns.create({
      trigger: options.trigger,
      inputSummary,
      outputSummary: message.slice(0, 500),
      status: "ok",
    });

    ctx.comments.createReply({
      commentId,
      sentText: message,
      status: "sent",
      agentRunId: run.id,
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

export function shouldScheduleCommentReply(replyMode: ReplyMode): boolean {
  return replyMode === "auto" || replyMode === "draft";
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
