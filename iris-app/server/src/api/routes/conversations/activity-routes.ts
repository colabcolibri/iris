import { sendError, sendJson } from "../../json.ts";
import { createRouter, route } from "../../router.ts";
import {
  listMessageActivity,
  parseMessageActivityKind,
} from "../../../domain/messages/list-message-activity.ts";

function serializeActivityItem(item: ReturnType<typeof listMessageActivity>[number]) {
  return {
    message_id: item.messageId,
    conversation_id: item.conversationId,
    participant_username: item.participantUsername,
    text_preview: item.textPreview,
    occurred_at: item.occurredAt,
    conversation_pending_count: item.conversationPendingCount,
    draft_text_preview: item.draftTextPreview,
    sent_text_preview: item.sentTextPreview,
  };
}

export const conversationsActivityRouter = createRouter([
  route("GET", "/api/conversations/activity", { admin: true }, async (match) => {
    let kind;
    try {
      kind = parseMessageActivityKind(match.searchParams.get("kind"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "invalid kind";
      sendError(match.res, 422, message);
      return;
    }

    const limitRaw = Number(match.searchParams.get("limit") ?? "");
    const limit = Number.isFinite(limitRaw) ? limitRaw : undefined;

    const items = listMessageActivity({
      kind,
      limit,
      listActivityRows: (activityKind, activityLimit) =>
        match.ctx.messageReplies.listActivityRows(activityKind, activityLimit),
    });

    sendJson(match.res, 200, {
      kind,
      items: items.map(serializeActivityItem),
    });
  }),
]);
