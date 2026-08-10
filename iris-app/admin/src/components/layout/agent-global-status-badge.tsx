import { Link } from "react-router-dom";
import { Bot, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AgentGlobalStatusBadgeProps = {
  enabled: boolean;
  loading?: boolean;
  className?: string;
};

export function AgentGlobalStatusBadge({
  enabled,
  loading = false,
  className,
}: AgentGlobalStatusBadgeProps) {
  const Icon = enabled ? Bot : PauseCircle;

  return (
    <Link
      to="/settings"
      title={
        enabled
          ? "Agente de comentários ativo globalmente. Clique para abrir configurações."
          : "Agente de comentários pausado globalmente. Clique para reativar nas configurações."
      }
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        enabled
          ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
          : "border-amber-400/35 bg-amber-500/15 text-amber-50 hover:bg-amber-500/25",
        loading && "opacity-60",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="hidden truncate sm:inline">
        {loading ? "Agente…" : enabled ? "Agente ativo" : "Agente pausado"}
      </span>
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          enabled ? "bg-emerald-300" : "bg-amber-300",
        )}
        aria-hidden
      />
    </Link>
  );
}
