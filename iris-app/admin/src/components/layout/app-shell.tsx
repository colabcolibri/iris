import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar, type AppView } from "@/components/layout/app-sidebar";
import {
  IrisSidebarInset,
  IrisSidebarProvider,
} from "@/components/layout/iris-sidebar";
import { DemoBanner, useDemoMode } from "@/demo/demo-mode-context";
import { useDemoLocale } from "@/demo/demo-locale-context";

type AppShellProps = {
  sidebarView?: AppView;
  onSidebarViewChange?: (view: AppView) => void;
  children: ReactNode;
};

export function AppShell({
  sidebarView,
  onSidebarViewChange,
  children,
}: AppShellProps) {
  const { isDemoMode } = useDemoMode();
  const { locale } = useDemoLocale();

  return (
    <IrisSidebarProvider
      demoChrome={isDemoMode}
      demoLocale={isDemoMode ? locale : undefined}
    >
      {isDemoMode ? <DemoBanner /> : null}
      <AppHeader />

      <div className="flex min-h-0 flex-1">
        <AppSidebar view={sidebarView} onViewChange={onSidebarViewChange} />

        <IrisSidebarInset>{children}</IrisSidebarInset>
      </div>
    </IrisSidebarProvider>
  );
}
