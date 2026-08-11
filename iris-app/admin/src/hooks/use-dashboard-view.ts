import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { AppView } from "@/components/layout/app-sidebar";
import { ROUTES } from "@/lib/routes";

function readView(search: string): AppView {
  return new URLSearchParams(search).get("view") === "kanban" ? "kanban" : "calendar";
}

export function useDashboardView() {
  const location = useLocation();
  const navigate = useNavigate();
  const onDashboard = location.pathname === ROUTES.admin.root;
  const view = onDashboard ? readView(location.search) : "calendar";

  const setView = useCallback(
    (next: AppView) => {
      navigate(next === "kanban" ? `${ROUTES.admin.root}?view=kanban` : ROUTES.admin.root);
    },
    [navigate],
  );

  return { view, setView, onDashboard };
}
