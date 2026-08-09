import { AtSign, LogOut, Plus } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MetaStatus } from "@/lib/types";

type AppHeaderProps = {
  meta: MetaStatus | null;
  onLogout: () => void;
  onNewPost: () => void;
  onMetaHealth?: () => void;
};

export function AppHeader({ meta, onLogout, onNewPost, onMetaHealth }: AppHeaderProps) {
  const connected = Boolean(meta?.connected);
  const handle = meta?.igUsername ? `@${meta.igUsername}` : null;

  return (
    <header className="flex h-20 shrink-0 flex-wrap items-center justify-between gap-4 border-b border-black/20 bg-[#1f1d1b] px-6 text-white shadow-sm">
      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3 md:hidden">
          <BrandLogo size="sm" />
          <span className="font-display text-2xl font-semibold tracking-tight">Iris</span>
        </div>

        {connected && handle ? (
          <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 md:flex">
            <AtSign className="size-3.5 text-emerald-300" />
            <span className="text-sm">{handle}</span>
            <span className="size-2 rounded-full bg-emerald-400" aria-hidden />
          </div>
        ) : (
          <span
            className={cn(
              "hidden rounded-full px-3 py-1.5 text-xs font-medium md:inline-flex",
              meta?.tokenExpired
                ? "bg-amber-500/15 text-amber-200"
                : "bg-white/10 text-white/80",
            )}
          >
            {meta?.tokenExpired ? "Token expirado" : "Instagram desconectado"}
          </span>
        )}
      </div>

      <div className="hidden items-center gap-6 lg:flex">
        <a
          href="/auth/meta"
          className="text-sm text-white/60 transition-colors hover:text-white"
        >
          Reconectar
        </a>
        {connected && onMetaHealth && (
          <button
            type="button"
            onClick={onMetaHealth}
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            Testar conexão
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="hidden text-white/70 hover:bg-white/10 hover:text-white md:inline-flex"
        >
          <LogOut className="mr-2 size-4" />
          Sair
        </Button>
        <Button
          size="sm"
          onClick={onNewPost}
          className="rounded-full bg-primary px-6 uppercase tracking-wide shadow-sm hover:bg-primary/90"
        >
          <Plus className="mr-2 size-4" />
          Nova postagem
        </Button>
      </div>
    </header>
  );
}
