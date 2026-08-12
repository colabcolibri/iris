import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar, type AppView } from "@/components/layout/app-sidebar";
import {
  IrisSidebarInset,
  IrisSidebarProvider,
} from "@/components/layout/iris-sidebar";
import { DemoBanner, useDemoMode } from "@/demo/demo-mode-context";
import { useChromeTop } from "@/hooks/use-chrome-top";

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
  const { chromeRef, chromeTop } = useChromeTop();

  return (
    <IrisSidebarProvider chromeTop={chromeTop}>
      <div ref={chromeRef} className="shrink-0">
        {isDemoMode ? <DemoBanner /> : null}
        <AppHeader />
      </div>

      <div className="flex min-h-0 flex-1">
        <AppSidebar view={sidebarView} onViewChange={onSidebarViewChange} />

        <IrisSidebarInset>{children}</IrisSidebarInset>
      </div>
    </IrisSidebarProvider>
  );
}
