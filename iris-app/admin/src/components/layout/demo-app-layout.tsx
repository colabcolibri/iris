import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { useDemoLocale } from "@/demo/demo-locale-context";
import { useDashboardView } from "@/hooks/use-dashboard-view";

/** Remonta rotas do demo ao trocar idioma para recarregar fixtures traduzidas. */
export function DemoAppLayout() {
  const { locale } = useDemoLocale();
  const { view, setView } = useDashboardView();

  return (
    <AppShell sidebarView={view} onSidebarViewChange={setView}>
      <Outlet key={locale} />
    </AppShell>
  );
}
