import { sendError, sendJson } from "../../json.ts";
import { createRouter, route } from "../../router.ts";
import {
  listCommentActivity,
  parseCommentActivityKind,
} from "../../../domain/comments/list-comment-activity.ts";
import { brandUsername } from "./shared.ts";

function serializeActivityItem(item: ReturnType<typeof listCommentActivity>[number]) {
  return {
    comment_id: item.commentId,
    post_id: item.postId,
    ig_media_id: item.igMediaId,
    text_preview: item.textPreview,
    author_username: item.authorUsername,
    occurred_at: item.occurredAt,
    post_caption_preview: item.postCaptionPreview,
    post_pending_count: item.postPendingCount,
    draft_text_preview: item.draftTextPreview,
    sent_text_preview: item.sentTextPreview,
  };
}

export const commentsActivityRouter = createRouter([
  route("GET", "/api/comments/activity", { admin: true }, async (match) => {
    let kind;
    try {
      kind = parseCommentActivityKind(match.searchParams.get("kind"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "invalid kind";
      sendError(match.res, 422, message);
      return;
    }

    const limitRaw = Number(match.searchParams.get("limit") ?? "");
    const limit = Number.isFinite(limitRaw) ? limitRaw : undefined;

    const items = listCommentActivity({
      kind,
      limit,
      brandUsername: brandUsername(match.ctx),
      listActivityRows: (activityKind, activityLimit, activityBrand) =>
        match.ctx.comments.listActivityRows(activityKind, activityLimit, activityBrand),
    });

    sendJson(match.res, 200, {
      kind,
      items: items.map(serializeActivityItem),
    });
  }),
]);
