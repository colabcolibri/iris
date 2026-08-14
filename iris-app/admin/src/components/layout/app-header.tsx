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
import { LanguageSwitcher } from "@/components/layout/language-switcher";
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
import { DemoLanguageSwitcher } from "@/demo/demo-language-switcher";
import { useDemoLocale } from "@/demo/demo-locale-context";
import { useDomainMessages } from "@/i18n/provider";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();
  const { m: demoMessages } = useDemoLocale();
  const shell = useDomainMessages("shell");
  const { signOut } = useAuthSession();
  const { replyMode, loading: settingsLoading } = useAppSettings();
  const { confirm } = useConfirmDialog();
  const { meta, handleDisconnect, handleMetaHealth } = useMetaSession();
  const connected = Boolean(meta?.connected);
  const handle = meta?.igUsername ? `@${meta.igUsername}` : null;
  const tokenExpired = Boolean(meta?.tokenExpired);

  async function handleLogout() {
    const ok = await confirm({
      title: shell.header.confirmSignOutTitle,
      description: shell.header.confirmSignOutDescription,
      confirmLabel: shell.header.confirmSignOutAction,
      variant: "destructive",
    });
    if (!ok) return;
    await signOut();
    navigate(ROUTES.admin.login, { replace: true });
  }

  async function handleDisconnectMeta() {
    const ok = await confirm({
      title: shell.header.confirmDisconnectTitle,
      description: shell.header.confirmDisconnectDescription,
      confirmLabel: shell.header.confirmDisconnectAction,
      variant: "destructive",
    });
    if (!ok) return;
    await handleDisconnect();
  }

  async function handleSwitchAccount() {
    const ok = await confirm({
      title: shell.header.confirmSwitchTitle,
      description: shell.header.confirmSwitchDescription,
      confirmLabel: shell.header.confirmSwitchAction,
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
              {shell.meta.creativeScheduler}
            </p>
          </div>
        </div>

        {!connected && !isDemoMode ? (
          <p className="hidden max-w-xs text-sm text-sidebar-foreground/70 lg:block">
            {tokenExpired
              ? shell.header.tokenExpiredHint
              : shell.header.connectHint}
          </p>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
        {isDemoMode ? <DemoLanguageSwitcher /> : <LanguageSwitcher />}
        <AgentGlobalStatusBadge
          replyMode={replyMode}
          loading={settingsLoading}
        />

        {!connected && !isDemoMode ? (
          <a
            href="/auth/meta"
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full px-5.5 py-2.75 text-base font-normal leading-none transition-transform active:scale-95",
              tokenExpired
                ? "bg-amber-500 text-amber-950 hover:bg-amber-400"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            <InstagramIcon className="size-4 shrink-0" />
            <span className="hidden sm:inline">
              {tokenExpired
                ? shell.header.reconnectInstagram
                : shell.header.connectInstagram}
            </span>
            <span className="sm:hidden">{shell.header.connectShort}</span>
          </a>
        ) : isDemoMode && connected && handle ? (
          <div className="inline-flex h-11 items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 text-sm text-sidebar-foreground">
            <InstagramIcon className="size-4 text-emerald-300" />
            <span className="max-w-36 truncate sm:max-w-none">{handle}</span>
            <span className="text-xs text-sidebar-foreground/60">
              {demoMessages.instagramDemo}
            </span>
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
                    aria-label={shell.header.instagramConnectedAria}
                  />
                }
              >
                <InstagramIcon className="size-4 text-emerald-300" />
                <span className="max-w-36 truncate text-sm font-normal sm:max-w-none">
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
                  <DropdownMenuLabel>
                    {shell.header.instagramConnected}
                  </DropdownMenuLabel>
                  <p className="px-2 pb-1 text-xs text-muted-foreground">
                    {handle}
                  </p>
                  <DropdownMenuItem onClick={() => void handleMetaHealth()}>
                    <RefreshCw className="size-4" />
                    {shell.header.testConnection}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleSwitchAccount()}>
                    <UserRound className="size-4" />
                    {shell.header.switchAccount}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => void handleDisconnectMeta()}
                  >
                    <Unplug className="size-4" />
                    {shell.header.disconnect}
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
            {shell.header.signOut}
          </Button>
        ) : null}
      </div>
    </header>
  );
}
