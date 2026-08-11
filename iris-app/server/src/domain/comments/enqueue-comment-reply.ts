import type { AppContext } from "../../api/app-context.ts";
import { getAppSettingsOrDefault } from "../../adapters/sqlite/app-settings-repository.ts";
import {
  resolveEffectiveReplyMode,
  shouldScheduleCommentReply,
} from "../reply-mode.ts";
import { computeAgentReplyNotBefore } from "./compute-agent-reply-not-before.ts";

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

  const notBefore = computeAgentReplyNotBefore(new Date(), appSettings.replyDelaySeconds);
  return ctx.comments.scheduleAgentReply(commentId, notBefore);
}
