import type { AppContext } from "../../app-context.ts";
import type { Message } from "../../../domain/messages/message.ts";
import { resolveMessageDraftText } from "../../../domain/messages/resolve-message-draft.ts";
import { serializeMessage } from "../../../domain/messages/serialize-message.ts";

export const MAX_MESSAGE_REPLY_LENGTH = 1000;

export function serializeMessageWithDraft(message: Message, ctx: AppContext) {
  const draft = ctx.messageReplies.findLatestDraft(message.id);
  const sent = ctx.messageReplies.findLatestSentReply(message.id);
  return {
    ...serializeMessage(message),
    draft_text: resolveMessageDraftText(message, ctx),
    draft_status: draft?.status ?? null,
    linked_reply_text: sent?.sentText ?? null,
    linked_reply_ig_message_id: sent?.sourceIgMessageId ?? null,
  };
}
