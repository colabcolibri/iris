import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { AppView } from "@/components/layout/app-sidebar";
import { useDemoMode } from "@/demo/demo-mode-context";
import { ROUTES } from "@/lib/routes";

function readView(search: string): AppView {
  const value = new URLSearchParams(search).get("view");
  if (value === "kanban") return "kanban";
  if (value === "list") return "list";
  return "calendar";
}

export function useDashboardView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();
  const dashboardRoot = isDemoMode ? ROUTES.demo.root : ROUTES.admin.root;

  function viewHref(view: AppView) {
    if (view === "kanban") return `${dashboardRoot}?view=kanban`;
    if (view === "list") return `${dashboardRoot}?view=list`;
    return dashboardRoot;
  }

  const onDashboard = location.pathname === dashboardRoot;
  const view = onDashboard ? readView(location.search) : "calendar";

  const setView = useCallback(
    (next: AppView) => {
      navigate(viewHref(next));
    },
    [navigate, dashboardRoot],
  );

  return { view, setView, onDashboard };
}
