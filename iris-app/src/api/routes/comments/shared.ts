import type { AppContext } from "../../app-context.ts";
import { serializeComment } from "../../../adapters/sqlite/mappers.ts";

export const MAX_REPLY_LENGTH = 2200;

export function brandUsername(ctx: AppContext): string | null {
  return ctx.metaConnectionStore.get()?.igUsername ?? null;
}

export function commentReconcileDeps(ctx: AppContext) {
  return {
    listByPostId: ctx.comments.listByPostId,
    hasReplyRecord: ctx.comments.hasReplyRecord,
    linkInstagramReply: (input: {
      userCommentId: string;
      brandIgCommentId: string;
      sentText: string | null;
    }) => ctx.comments.linkInstagramReply(input),
    markSkipped: ctx.comments.markSkipped,
  };
}

export function postCommentSyncDeps(ctx: AppContext) {
  return {
    metaCommentReader: ctx.metaCommentReader,
    upsertFromWebhook: (input: Parameters<AppContext["comments"]["upsertFromWebhook"]>[0]) =>
      ctx.comments.upsertFromWebhook(input),
    listByPostId: (postId: string) => ctx.comments.listByPostId(postId),
    markDeletedFromInstagram: (id: string) => ctx.comments.markDeletedFromInstagram(id),
    restoreFromInstagram: (id: string) => ctx.comments.restoreFromInstagram(id),
  };
}

export function serializeCommentWithDraft(
  comment: Parameters<typeof serializeComment>[0],
  ctx: AppContext,
) {
  const draft = ctx.comments.findLatestDraft(comment.id);
  const sent = ctx.comments.findLatestSentReply(comment.id);
  return {
    ...serializeComment(comment),
    draft_text: draft?.draftText ?? null,
    draft_status: draft?.status ?? null,
    linked_reply_text: sent?.sentText ?? null,
    linked_reply_ig_comment_id: sent?.sourceIgCommentId ?? null,
    reply_to_ig_comment_id: sent?.replyToIgCommentId ?? null,
  };
}
