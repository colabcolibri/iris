import {
  ChevronDown,
  LogOut,
  RefreshCw,
  UserRound,
  Unplug,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { BrandLogo } from "@/components/layout/brand-logo";
import { AgentGlobalStatusBadge } from "@/components/layout/agent-global-status-badge";
import { IrisSidebarTrigger } from "@/components/layout/iris-sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthSession } from "@/contexts/auth-session-context";
import { useAppSettings } from "@/contexts/app-settings-context";
import { useConfirmDialog } from "@/contexts/confirm-dialog-context";
import { useMetaSession } from "@/contexts/meta-session-context";
import { useDemoMode } from "@/demo/demo-mode-context";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();
  const { signOut } = useAuthSession();
  const { replyMode, loading: settingsLoading } = useAppSettings();
  const { confirm } = useConfirmDialog();
  const { meta, handleDisconnect, handleMetaHealth } = useMetaSession();
  const connected = Boolean(meta?.connected);
  const handle = meta?.igUsername ? `@${meta.igUsername}` : null;
  const tokenExpired = Boolean(meta?.tokenExpired);

  async function handleLogout() {
    const ok = await confirm({
      title: "Sair do Iris?",
      description:
        "Você precisará de um novo código por email para entrar novamente.",
      confirmLabel: "Sair",
      variant: "destructive",
    });
    if (!ok) return;
    await signOut();
    navigate(ROUTES.admin.login, { replace: true });
  }

  async function handleDisconnectMeta() {
    const ok = await confirm({
      title: "Desconectar Instagram?",
      description:
        "O Iris deixa de publicar e sincronizar comentários até você conectar de novo.",
      confirmLabel: "Desconectar",
      variant: "destructive",
    });
    if (!ok) return;
    await handleDisconnect();
  }

  async function handleSwitchAccount() {
    const ok = await confirm({
      title: "Trocar conta do Instagram?",
      description:
        "Você será redirecionado ao login da Meta. A conta atual permanece até a nova conexão ser concluída.",
      confirmLabel: "Continuar",
    });
    if (!ok) return;
    window.location.href = "/auth/meta";
  }

  return (
    <header className="flex h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground sm:gap-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3 md:gap-5">
        <IrisSidebarTrigger className="size-11 shrink-0" />
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo size="sm" />
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold leading-none tracking-tight text-sidebar-foreground sm:text-2xl">
              iris
            </p>
            <p className="hidden truncate text-xs font-normal text-sidebar-foreground/60 sm:block">
              Creative scheduler
            </p>
          </div>
        </div>

        {!connected && !isDemoMode ? (
          <p className="hidden max-w-xs text-sm text-sidebar-foreground/70 lg:block">
            {tokenExpired
              ? "Sua sessão com o Instagram expirou. Conecte de novo para agendar publicações."
              : "Conecte sua conta do Instagram para agendar e publicar posts."}
          </p>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
        <AgentGlobalStatusBadge
          replyMode={replyMode}
          loading={settingsLoading}
        />

        {!connected && !isDemoMode ? (
          <a
            href="/auth/meta"
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full px-[22px] py-[11px] text-base font-normal leading-none transition-transform active:scale-95",
              tokenExpired
                ? "bg-amber-500 text-amber-950 hover:bg-amber-400"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            <InstagramIcon className="size-4 shrink-0" />
            <span className="hidden sm:inline">
              {tokenExpired ? "Reconectar Instagram" : "Conectar Instagram"}
            </span>
            <span className="sm:hidden">Conectar</span>
          </a>
        ) : isDemoMode && connected && handle ? (
          <div className="inline-flex h-11 items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 text-sm text-sidebar-foreground">
            <InstagramIcon className="size-4 text-emerald-300" />
            <span className="max-w-[9rem] truncate sm:max-w-none">{handle}</span>
            <span className="text-xs text-sidebar-foreground/60">(demo)</span>
          </div>
        ) : (
          handle && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-11 gap-2 rounded-full border-emerald-400/35 bg-emerald-500/10 px-3 text-sidebar-foreground hover:bg-emerald-500/20 hover:text-sidebar-foreground"
                    aria-label="Conta do Instagram conectada"
                  />
                }
              >
                <InstagramIcon className="size-4 text-emerald-300" />
                <span className="max-w-[9rem] truncate text-sm font-normal sm:max-w-none">
                  {handle}
                </span>
                <span
                  className="size-2 shrink-0 rounded-full bg-emerald-400"
                  aria-hidden
                />
                <ChevronDown className="size-3.5 shrink-0 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Instagram conectado</DropdownMenuLabel>
                  <p className="px-2 pb-1 text-xs text-muted-foreground">
                    {handle}
                  </p>
                  <DropdownMenuItem onClick={() => void handleMetaHealth()}>
                    <RefreshCw className="size-4" />
                    Testar conexão
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleSwitchAccount()}>
                    <UserRound className="size-4" />
                    Trocar conta
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => void handleDisconnectMeta()}
                  >
                    <Unplug className="size-4" />
                    Desconectar
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        )}

        {!isDemoMode ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleLogout()}
          className="hidden min-h-11 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground md:inline-flex"
        >
          <LogOut className="mr-2 size-4" />
          Sair
        </Button>
        ) : null}
      </div>
    </header>
  );
}
