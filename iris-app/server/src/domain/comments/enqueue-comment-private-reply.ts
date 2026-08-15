import type { AppContext } from "../../api/app-context.ts";
import { getAppSettingsOrDefault } from "../../adapters/sqlite/app-settings-repository.ts";
import {
  resolveEffectivePrivateReplyMode,
  shouldSchedulePrivateReply,
} from "../posts/private-reply-mode.ts";
import { computeAgentReplyNotBefore } from "./compute-agent-reply-not-before.ts";
import {
  buildPrivateReplyWindowExpiredMessage,
  isCommentWithinPrivateReplyWindow,
} from "./comment-private-reply-window.ts";
import {
  buildPostAgentInactiveMessage,
  isPostWithinAgentActiveWindow,
} from "../posts/post-agent-active.ts";
import { supersedeOlderPendingCommentReplies } from "../agent-reply/supersede-pending-agent-replies.ts";

export function enqueueCommentPrivateReply(
  ctx: AppContext,
  commentId: string,
): boolean {
  const comment = ctx.comments.findById(commentId);
  if (!comment || comment.deletedAt) {
    return false;
  }

  if (ctx.comments.hasPrivateReplyRecord(commentId)) {
    return false;
  }

  const appSettings = getAppSettingsOrDefault(ctx.appSettingsStore);
  const post = ctx.posts.findById(comment.postId);
  if (!post) {
    return false;
  }

  const effectivePrivateMode = resolveEffectivePrivateReplyMode(
    appSettings.privateReplyMode,
    post.privateReplyMode,
  );

  if (!shouldSchedulePrivateReply(effectivePrivateMode)) {
    return false;
  }

  if (!ctx.resolveLlmCompleter()) {
    return false;
  }

  if (!isPostWithinAgentActiveWindow(post)) {
    if (comment.status === "pending") {
      ctx.comments.markSkipped(commentId, buildPostAgentInactiveMessage());
    }
    return false;
  }

  if (!isCommentWithinPrivateReplyWindow(comment)) {
    if (comment.status === "pending") {
      ctx.comments.markSkipped(commentId, buildPrivateReplyWindowExpiredMessage());
    }
    return false;
  }

  if (comment.status === "pending") {
    supersedeOlderPendingCommentReplies(ctx.comments, comment);
  }

  const notBefore = computeAgentReplyNotBefore(new Date(), appSettings.replyDelaySeconds);
  return ctx.comments.scheduleAgentReply(commentId, notBefore);
}
