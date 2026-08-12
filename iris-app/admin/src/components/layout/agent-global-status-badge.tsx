import { Link } from "react-router-dom";
import { Bot, BotOff, ClipboardCheck } from "lucide-react";
import { replyModeOption } from "@/lib/reply-mode-options";
import type { ReplyMode } from "@/lib/types";
import { useAppRoutes } from "@/demo/demo-routes";
import { cn } from "@/lib/utils";

type AgentGlobalStatusBadgeProps = {
  replyMode: ReplyMode;
  loading?: boolean;
  className?: string;
};

const BADGE_STYLES: Record<ReplyMode, string> = {
  auto: "border-emerald-400/35 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25",
  draft: "border-sky-400/35 bg-sky-500/15 text-sky-50 hover:bg-sky-500/25",
  off: "border-amber-400/35 bg-amber-500/15 text-amber-50 hover:bg-amber-500/25",
};

const ICONS = {
  auto: Bot,
  draft: ClipboardCheck,
  off: BotOff,
} as const;

export function AgentGlobalStatusBadge({
  replyMode,
  loading = false,
  className,
}: AgentGlobalStatusBadgeProps) {
  const routes = useAppRoutes();
  const Icon = ICONS[replyMode];
  const label = replyModeOption(replyMode).label;

  return (
    <Link
      to={routes.settings}
      title={`Agente global: ${label}. Clique para abrir configurações.`}
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        BADGE_STYLES[replyMode],
        loading && "opacity-60",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="hidden truncate sm:inline">
        {loading ? "Agente…" : `Agente: ${label.toLowerCase()}`}
      </span>
      <span
        className="size-2 shrink-0 rounded-full bg-current opacity-70"
        aria-hidden
      />
    </Link>
  );
}
