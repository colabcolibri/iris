import type { ReplyMode } from "./reply-mode.ts";
import { isReplyMode } from "./reply-mode.ts";

export type PrivateReplyMode = ReplyMode;

export type PostPrivateReplyModeSetting = PrivateReplyMode | "inherit";

const POST_PRIVATE_REPLY_MODE_SETTINGS: PostPrivateReplyModeSetting[] = [
  "inherit",
  "off",
  "auto",
  "draft",
];

export function isPrivateReplyMode(value: string): value is PrivateReplyMode {
  return isReplyMode(value);
}

export function isPostPrivateReplyModeSetting(
  value: string,
): value is PostPrivateReplyModeSetting {
  return POST_PRIVATE_REPLY_MODE_SETTINGS.includes(value as PostPrivateReplyModeSetting);
}

export function shouldSchedulePrivateReply(mode: PrivateReplyMode): boolean {
  return mode === "auto" || mode === "draft";
}

export function resolveEffectivePrivateReplyMode(
  globalMode: PrivateReplyMode,
  postSetting: PostPrivateReplyModeSetting,
): PrivateReplyMode {
  if (postSetting === "inherit") {
    return globalMode;
  }

  return postSetting;
}
