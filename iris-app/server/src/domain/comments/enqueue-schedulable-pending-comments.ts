import type { AppContext } from "../../api/app-context.ts";
import { getAppSettingsOrDefault } from "../../adapters/sqlite/app-settings-repository.ts";
import { isBrandAuthor } from "./is-brand-author.ts";
import { enqueueCommentReply } from "./enqueue-comment-reply.ts";
import {
  resolveEffectiveReplyMode,
  shouldScheduleCommentReply,
} from "../posts/reply-mode.ts";

export type EnqueueSchedulablePendingCommentsOptions = {
  postId?: string;
};

/**
 * Agenda comentários pendentes que chegaram enquanto o post estava com IA off
 * (ou antes do enqueue no webhook), mas que já deveriam responder agora.
 */
export function enqueueSchedulablePendingComments(
  ctx: AppContext,
  options: EnqueueSchedulablePendingCommentsOptions = {},
): number {
  if (!ctx.resolveLlmCompleter()) {
    return 0;
  }

  const appSettings = getAppSettingsOrDefault(ctx.appSettingsStore);
  const brandUsername = ctx.metaConnectionStore.get()?.igUsername ?? null;
  const posts = options.postId
    ? [ctx.posts.findById(options.postId)].filter((post) => post != null)
    : ctx.posts
        .list()
        .filter((post) => post.status === "published" || post.status === "monitored");

  let enqueued = 0;

  for (const post of posts) {
    const effectiveReplyMode = resolveEffectiveReplyMode(
      appSettings.replyMode,
      post.replyMode,
    );

    if (!shouldScheduleCommentReply(effectiveReplyMode)) {
      continue;
    }

    for (const comment of ctx.comments.listByPostId(post.id).sort((left, right) => {
      const leftAt = left.igTimestamp ?? left.createdAt;
      const rightAt = right.igTimestamp ?? right.createdAt;
      return leftAt.localeCompare(rightAt);
    })) {
      if (comment.status !== "pending" || comment.deletedAt) {
        continue;
      }

      if (isBrandAuthor(comment.authorUsername, brandUsername)) {
        continue;
      }

      if (enqueueCommentReply(ctx, comment.id)) {
        enqueued += 1;
      }
    }
  }

  return enqueued;
}
