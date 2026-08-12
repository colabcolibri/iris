import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { AppView } from "@/components/layout/app-sidebar";
import { ROUTES } from "@/lib/routes";

function readView(search: string): AppView {
  const value = new URLSearchParams(search).get("view");
  if (value === "kanban") return "kanban";
  if (value === "list") return "list";
  return "calendar";
}

function viewHref(view: AppView) {
  if (view === "kanban") return `${ROUTES.admin.root}?view=kanban`;
  if (view === "list") return `${ROUTES.admin.root}?view=list`;
  return ROUTES.admin.root;
}

export function useDashboardView() {
  const location = useLocation();
  const navigate = useNavigate();
  const onDashboard = location.pathname === ROUTES.admin.root;
  const view = onDashboard ? readView(location.search) : "calendar";

  const setView = useCallback(
    (next: AppView) => {
      navigate(viewHref(next));
    },
    [navigate],
  );

  return { view, setView, onDashboard };
}
