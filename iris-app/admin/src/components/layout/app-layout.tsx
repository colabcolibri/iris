import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { useDashboardView } from "@/hooks/use-dashboard-view";

export function AppLayout() {
  const { view, setView } = useDashboardView();

  return (
    <AppShell sidebarView={view} onSidebarViewChange={setView}>
      <Outlet />
    </AppShell>
  );
}
