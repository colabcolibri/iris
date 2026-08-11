import type { LucideIcon } from "lucide-react";
import { BotOff, ClipboardCheck, Globe2, Zap } from "lucide-react";
import type { PostReplyModeSetting, ReplyMode } from "@/lib/types";

export type ReplyModeOption<T extends string = ReplyMode> = {
  value: T;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const GLOBAL_REPLY_MODE_OPTIONS: ReplyModeOption<ReplyMode>[] = [
  {
    value: "off",
    label: "Desligado",
    description: "A Iris não responde comentários em nenhum post que siga o global.",
    icon: BotOff,
  },
  {
    value: "auto",
    label: "Automático",
    description: "A Iris responde e publica no Instagram sem revisão.",
    icon: Zap,
  },
  {
    value: "draft",
    label: "Com aprovação",
    description: "A Iris sugere a resposta; você revisa e aprova antes de publicar.",
    icon: ClipboardCheck,
  },
];

export const POST_REPLY_MODE_OPTIONS: ReplyModeOption<PostReplyModeSetting>[] = [
  {
    value: "inherit",
    label: "Seguir global",
    description: "Usa o modo definido nas configurações do agente de comentários.",
    icon: Globe2,
  },
  {
    value: "off",
    label: "Pausar nesta publicação",
    description: "A Iris não responde comentários desta publicação (o modo global continua igual).",
    icon: BotOff,
  },
  {
    value: "auto",
    label: "Automático",
    description: "A Iris responde e publica no Instagram sem revisão.",
    icon: Zap,
  },
  {
    value: "draft",
    label: "Com aprovação",
    description: "A Iris sugere a resposta; você revisa e aprova antes de publicar.",
    icon: ClipboardCheck,
  },
];

export function replyModeOption(value: ReplyMode): ReplyModeOption<ReplyMode> {
  return (
    GLOBAL_REPLY_MODE_OPTIONS.find((option) => option.value === value) ??
    GLOBAL_REPLY_MODE_OPTIONS[0]
  );
}

export function postReplyModeOption(
  value: PostReplyModeSetting,
): ReplyModeOption<PostReplyModeSetting> {
  return (
    POST_REPLY_MODE_OPTIONS.find((option) => option.value === value) ??
    POST_REPLY_MODE_OPTIONS[0]
  );
}
