import { ChevronDown, LogOut, RefreshCw, UserRound, Unplug } from "lucide-react";
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
import { cn } from "@/lib/utils";

export function AppHeader() {
  const navigate = useNavigate();
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
      description: "Você precisará de um novo código por email para entrar novamente.",
      confirmLabel: "Sair",
      variant: "destructive",
    });
    if (!ok) return;
    await signOut();
    navigate("/login", { replace: true });
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
    <header className="flex h-20 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-black/20 bg-[#1f1d1b] px-4 text-white shadow-sm sm:gap-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3 md:gap-5">
        <IrisSidebarTrigger />
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo size="sm" />
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold leading-none tracking-tight sm:text-2xl">
              Iris
            </p>
            <p className="hidden truncate text-xs text-white/60 sm:block">Creative scheduler</p>
          </div>
        </div>

        {!connected ? (
          <p className="hidden max-w-xs text-sm text-white/70 lg:block">
            {tokenExpired
              ? "Sua sessão com o Instagram expirou. Conecte de novo para agendar publicações."
              : "Conecte sua conta do Instagram para agendar e publicar posts."}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <AgentGlobalStatusBadge replyMode={replyMode} loading={settingsLoading} />

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
            <span className="hidden sm:inline">
              {tokenExpired ? "Reconectar Instagram" : "Conectar Instagram"}
            </span>
            <span className="sm:hidden">Conectar</span>
          </a>
        ) : (
          handle && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 rounded-full border-emerald-400/35 bg-emerald-500/10 px-3 text-white hover:bg-emerald-500/20 hover:text-white"
                    aria-label="Conta do Instagram conectada"
                  />
                }
              >
                <InstagramIcon className="size-4 text-emerald-300" />
                <span className="max-w-[9rem] truncate text-sm font-medium sm:max-w-none">
                  {handle}
                </span>
                <span className="size-2 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                <ChevronDown className="size-3.5 shrink-0 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Instagram conectado</DropdownMenuLabel>
                  <p className="px-2 pb-1 text-xs text-muted-foreground">{handle}</p>
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

        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleLogout()}
          className="hidden text-white/80 hover:bg-white/10 hover:text-white md:inline-flex"
        >
          <LogOut className="mr-2 size-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
