import { LogOut, Plus } from "lucide-react";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { BrandLogo } from "@/components/layout/brand-logo";
import { AppMobileNav } from "@/components/layout/app-mobile-nav";
import type { AppView } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MetaStatus } from "@/lib/types";

type AppHeaderProps = {
  meta: MetaStatus | null;
  onLogout: () => void;
  onNewPost: () => void;
  onMetaHealth?: () => void;
  sidebarView?: AppView;
  onSidebarViewChange?: (view: AppView) => void;
};

export function AppHeader({
  meta,
  onLogout,
  onNewPost,
  onMetaHealth,
  sidebarView,
  onSidebarViewChange,
}: AppHeaderProps) {
  const connected = Boolean(meta?.connected);
  const handle = meta?.igUsername ? `@${meta.igUsername}` : null;
  const tokenExpired = Boolean(meta?.tokenExpired);

  return (
    <header className="flex h-20 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-black/20 bg-[#1f1d1b] px-4 text-white shadow-sm sm:gap-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3 md:gap-6">
        <AppMobileNav view={sidebarView} onViewChange={onSidebarViewChange} />
        <div className="flex items-center gap-3 md:hidden">
          <BrandLogo size="sm" />
          <span className="font-display text-2xl font-semibold tracking-tight">Iris</span>
        </div>

        {connected && handle ? (
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 md:flex">
            <InstagramIcon className="size-3.5 text-emerald-300" />
            <span className="text-sm">Instagram {handle}</span>
            <span className="size-2 rounded-full bg-emerald-400" aria-hidden />
          </div>
        ) : (
          <p className="hidden max-w-xs text-sm text-white/70 md:block">
            {tokenExpired
              ? "Sua sessão com o Instagram expirou. Conecte de novo para agendar publicações."
              : "Conecte sua conta do Instagram para agendar e publicar posts."}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        {!connected ? (
          <a
            href="/auth/meta"
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors",
              tokenExpired
                ? "bg-amber-500 text-amber-950 hover:bg-amber-400"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            <InstagramIcon className="size-4 shrink-0" />
            {tokenExpired ? "Reconectar Instagram" : "Conectar Instagram"}
          </a>
        ) : (
          <a
            href="/auth/meta"
            className="hidden items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white lg:inline-flex"
          >
            <InstagramIcon className="size-4" />
            Trocar conta
          </a>
        )}

        {connected && onMetaHealth && (
          <button
            type="button"
            onClick={onMetaHealth}
            className="hidden text-sm text-white/60 transition-colors hover:text-white lg:inline"
          >
            Testar conexão
          </button>
        )}

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
          className="rounded-full bg-primary px-4 uppercase tracking-wide shadow-sm hover:bg-primary/90 sm:px-6"
        >
          <Plus className="mr-2 size-4" />
          <span className="hidden sm:inline">Nova postagem</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>
    </header>
  );
}
