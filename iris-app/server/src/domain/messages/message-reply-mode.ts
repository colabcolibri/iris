import type { ConversationReplyMode } from "./conversation.ts";
import {
  autoReplyEnabledFromReplyMode,
  isReplyMode,
  type ReplyMode,
} from "../posts/reply-mode.ts";

export type ConversationReplyModeSetting = ConversationReplyMode;

export function isConversationReplyModeSetting(
  value: string,
): value is ConversationReplyModeSetting {
  return value === "inherit" || isReplyMode(value);
}

export function resolveEffectiveMessageReplyMode(
  globalMode: ReplyMode,
  conversationSetting: ConversationReplyModeSetting,
): ReplyMode {
  if (conversationSetting === "inherit") {
    return globalMode;
  }
  return conversationSetting;
}

export function shouldScheduleMessageReply(mode: ReplyMode): boolean {
  return mode === "auto" || mode === "draft";
}
