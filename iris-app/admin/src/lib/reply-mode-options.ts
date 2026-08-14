import type { LucideIcon } from "lucide-react";
import { BotOff, ClipboardCheck, Globe2, Zap } from "lucide-react";
import { getDomainMessages } from "@/i18n/compose";
import type { AppLocale } from "@/i18n/types";
import type { PostReplyModeSetting, ReplyMode } from "@/lib/types";

export type ReplyModeOption<T extends string = ReplyMode> = {
  value: T;
  label: string;
  description: string;
  icon: LucideIcon;
};

const GLOBAL_ICONS: Record<ReplyMode, LucideIcon> = {
  off: BotOff,
  auto: Zap,
  draft: ClipboardCheck,
};

const POST_ICONS: Record<PostReplyModeSetting, LucideIcon> = {
  inherit: Globe2,
  off: BotOff,
  auto: Zap,
  draft: ClipboardCheck,
};

export function getGlobalReplyModeOptions(
  locale: AppLocale,
): ReplyModeOption<ReplyMode>[] {
  const modes = getDomainMessages("labels", locale).replyModeGlobal;
  return (["off", "auto", "draft"] as const).map((value) => ({
    value,
    label: modes[value].label,
    description: modes[value].description,
    icon: GLOBAL_ICONS[value],
  }));
}

export function getPostReplyModeOptions(
  locale: AppLocale,
): ReplyModeOption<PostReplyModeSetting>[] {
  const modes = getDomainMessages("labels", locale).replyModePost;
  return (["inherit", "off", "auto", "draft"] as const).map((value) => ({
    value,
    label: modes[value].label,
    description: modes[value].description,
    icon: POST_ICONS[value],
  }));
}

export function replyModeOption(
  value: ReplyMode,
  locale: AppLocale,
): ReplyModeOption<ReplyMode> {
  return (
    getGlobalReplyModeOptions(locale).find((option) => option.value === value) ??
    getGlobalReplyModeOptions(locale)[0]
  );
}

export function postReplyModeOption(
  value: PostReplyModeSetting,
  locale: AppLocale,
): ReplyModeOption<PostReplyModeSetting> {
  return (
    getPostReplyModeOptions(locale).find((option) => option.value === value) ??
    getPostReplyModeOptions(locale)[0]
  );
}

/** @deprecated Use getGlobalReplyModeOptions(locale) */
export const GLOBAL_REPLY_MODE_OPTIONS = getGlobalReplyModeOptions("pt");

/** @deprecated Use getPostReplyModeOptions(locale) */
export const POST_REPLY_MODE_OPTIONS = getPostReplyModeOptions("pt");
