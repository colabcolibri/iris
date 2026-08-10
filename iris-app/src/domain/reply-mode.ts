export type ReplyMode = "off" | "auto" | "draft";

const REPLY_MODES: ReplyMode[] = ["off", "auto", "draft"];

export function isReplyMode(value: string): value is ReplyMode {
  return REPLY_MODES.includes(value as ReplyMode);
}

export function replyModeFromAutoReplyEnabled(enabled: boolean): ReplyMode {
  return enabled ? "auto" : "off";
}
