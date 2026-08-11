import type { AppContext } from "../../api/app-context.ts";
import { ValidationError } from "../../api/json.ts";
import type { MetaCommentReplier } from "../../ports/meta-comment-replier.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import {
  getMetaReadiness,
  metaReadinessMessage,
} from "../meta-readiness.ts";
import { isBrandAuthor } from "./is-brand-author.ts";
import { processCommentReply } from "./process-comment-reply.ts";

export type ManualCommentReplyMode = "auto" | "draft";

export type RequestManualCommentReplyOptions = {
  llmCompleter?: LlmCompleter | null;
  metaCommentReplier?: MetaCommentReplier;
};

export function validateManualCommentReply(
  ctx: AppContext,
  commentId: string,
  mode: ManualCommentReplyMode,
  brandUsername: string | null,
): string | null {
  const comment = ctx.comments.findById(commentId);
  if (!comment) {
    return "comment not found";
  }

  if (comment.deletedAt) {
    return "comment was removed from instagram";
  }

  if (comment.status === "replied" || comment.status === "skipped") {
    return "comment already handled";
  }

  if (comment.status !== "pending" && comment.status !== "failed") {
    return "comment cannot receive manual AI reply";
  }

  if (isBrandAuthor(comment.authorUsername, brandUsername)) {
    return "cannot reply to brand comments";
  }

  const sent = ctx.comments.findLatestSentReply(commentId);
  if (sent?.sentText) {
    return "comment already has a sent reply";
  }

  if (!ctx.resolveLlmCompleter()) {
    return "LLM is not configured";
  }

  if (mode === "auto") {
    const readiness = getMetaReadiness(ctx);
    if (!readiness.ready) {
      return metaReadinessMessage(readiness);
    }

    if (!ctx.metaCommentReplier) {
      return "Meta comment replier is not configured";
    }
  }

  return null;
}

export async function requestManualCommentReply(
  ctx: AppContext,
  commentId: string,
  mode: ManualCommentReplyMode,
  options: RequestManualCommentReplyOptions = {},
  brandUsername: string | null,
): Promise<boolean> {
  const validationError = validateManualCommentReply(
    ctx,
    commentId,
    mode,
    brandUsername,
  );
  if (validationError) {
    throw new ValidationError(validationError);
  }

  const comment = ctx.comments.findById(commentId);
  if (!comment) {
    throw new ValidationError("comment not found");
  }

  if (comment.status === "failed") {
    ctx.comments.markPending(commentId);
  }

  const llm = options.llmCompleter ?? ctx.resolveLlmCompleter();
  if (!llm) {
    throw new ValidationError("LLM is not configured");
  }

  return processCommentReply(ctx, commentId, {
    trigger: "manual",
    replyModeOverride: mode,
    llmCompleter: llm,
    metaCommentReplier: options.metaCommentReplier,
  });
}
