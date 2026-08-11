export type ReplyMode = "off" | "auto" | "draft";

export type PostReplyModeSetting = ReplyMode | "inherit";

const REPLY_MODES: ReplyMode[] = ["off", "auto", "draft"];

const POST_REPLY_MODE_SETTINGS: PostReplyModeSetting[] = [
  "inherit",
  "off",
  "auto",
  "draft",
];

export function isReplyMode(value: string): value is ReplyMode {
  return REPLY_MODES.includes(value as ReplyMode);
}

export function isPostReplyModeSetting(
  value: string,
): value is PostReplyModeSetting {
  return POST_REPLY_MODE_SETTINGS.includes(value as PostReplyModeSetting);
}

export function replyModeFromAutoReplyEnabled(enabled: boolean): ReplyMode {
  return enabled ? "auto" : "off";
}

export function autoReplyEnabledFromReplyMode(mode: ReplyMode): boolean {
  return mode !== "off";
}

export function shouldScheduleCommentReply(mode: ReplyMode): boolean {
  return mode === "auto" || mode === "draft";
}

export function resolveEffectiveReplyMode(
  globalMode: ReplyMode,
  postSetting: PostReplyModeSetting,
): ReplyMode {
  if (postSetting === "inherit") {
    return globalMode;
  }

  return postSetting;
}
