import type { AppContext } from "../../api/app-context.ts";
import { getAppSettingsOrDefault } from "../../adapters/sqlite/app-settings-repository.ts";
import {
  resolveEffectiveReplyMode,
  shouldScheduleCommentReply,
} from "../posts/reply-mode.ts";
import { computeAgentReplyNotBefore } from "./compute-agent-reply-not-before.ts";
import {
  buildCommentTooOldMessage,
  isCommentWithinReplyMaxAge,
} from "./comment-reply-max-age.ts";
import { supersedeOlderPendingCommentReplies } from "../agent-reply/supersede-pending-agent-replies.ts";

export function enqueueCommentReply(ctx: AppContext, commentId: string): boolean {
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

  if (!ctx.resolveLlmCompleter()) {
    return false;
  }

  if (!isCommentWithinReplyMaxAge(comment, appSettings.replyMaxAgeDays)) {
    ctx.comments.markSkipped(
      commentId,
      buildCommentTooOldMessage(appSettings.replyMaxAgeDays),
    );
    return false;
  }

  supersedeOlderPendingCommentReplies(ctx.comments, comment);

  const notBefore = computeAgentReplyNotBefore(new Date(), appSettings.replyDelaySeconds);
  return ctx.comments.scheduleAgentReply(commentId, notBefore);
}
