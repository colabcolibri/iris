import type { LucideIcon } from "lucide-react";
import { BotOff, ClipboardCheck, Zap } from "lucide-react";
import type { ReplyMode } from "@/lib/types";

export type ReplyModeOption = {
  value: ReplyMode;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const REPLY_MODE_OPTIONS: ReplyModeOption[] = [
  {
    value: "off",
    label: "Desligado neste post",
    description: "A Iris não responde comentários desta publicação.",
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

export function replyModeOption(value: ReplyMode): ReplyModeOption {
  return REPLY_MODE_OPTIONS.find((option) => option.value === value) ?? REPLY_MODE_OPTIONS[0];
}
