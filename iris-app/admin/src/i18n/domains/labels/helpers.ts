import {
  BotOff,
  ClipboardCheck,
  Globe2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { getDomainMessages } from "@/i18n/compose";
import type { AppLocale } from "@/i18n/types";
import type {
  PostReplyModeSetting,
  PostStatus,
  ReplyAuditStep,
  ReplyMode,
} from "@/lib/types";

const KANBAN_COLUMN_IDS = [
  "draft",
  "scheduled",
  "published",
  "failed",
  "cancelled",
] as const;

type KanbanColumnId = (typeof KANBAN_COLUMN_IDS)[number];

const GLOBAL_REPLY_MODE_ICONS: Record<ReplyMode, LucideIcon> = {
  off: BotOff,
  auto: Zap,
  draft: ClipboardCheck,
};

const POST_REPLY_MODE_ICONS: Record<PostReplyModeSetting, LucideIcon> = {
  inherit: Globe2,
  off: BotOff,
  auto: Zap,
  draft: ClipboardCheck,
};

export type ReplyModeOption<T extends string = ReplyMode> = {
  value: T;
  label: string;
  description: string;
  icon: LucideIcon;
};

export function getPostStatusLabel(
  status: PostStatus,
  locale: AppLocale,
): string {
  return getDomainMessages("labels", locale).postStatus[status];
}

export function getKanbanColumns(
  locale: AppLocale,
): { id: KanbanColumnId; label: string }[] {
  const columns = getDomainMessages("labels", locale).kanbanColumns;
  return KANBAN_COLUMN_IDS.map((id) => ({
    id,
    label: columns[id],
  }));
}

export function getGlobalReplyModeOptions(
  locale: AppLocale,
): ReplyModeOption<ReplyMode>[] {
  const modes = getDomainMessages("labels", locale).replyModeGlobal;
  return (["off", "auto", "draft"] as const).map((value) => ({
    value,
    label: modes[value].label,
    description: modes[value].description,
    icon: GLOBAL_REPLY_MODE_ICONS[value],
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
    icon: POST_REPLY_MODE_ICONS[value],
  }));
}

export function getReplyAuditStageLabel(
  stage: string,
  locale: AppLocale,
): string {
  const stages = getDomainMessages("labels", locale).audit.stages;
  return stages[stage] ?? stage;
}

export function getReplyAuditVerdictLabel(
  verdict: ReplyAuditStep["verdict"],
  locale: AppLocale,
): string {
  return getDomainMessages("labels", locale).audit.verdicts[verdict];
}
