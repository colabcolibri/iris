import { useMemo } from "react";
import { useDemoMode } from "@/demo/demo-mode-context";
import { ROUTES } from "@/lib/routes";

export const DEMO_BASE = ROUTES.demo.root;

export const demoPath = (segment = "") =>
  segment ? `${ROUTES.demo.root}/${segment.replace(/^\//, "")}` : ROUTES.demo.root;

export type AppRouteSet = {
  root: string;
  comments: string;
  messages: string;
  products: string;
  stores: string;
  webhooks: string;
  agentRuns: string;
  agentSimulator: string;
  settings: string;
  persona: string;
};

export function useAppRoutes(): AppRouteSet {
  const { isDemoMode } = useDemoMode();
  return useMemo(
    () => (isDemoMode ? ROUTES.demo : ROUTES.admin),
    [isDemoMode],
  );
}

export function dashboardViewHref(
  routes: AppRouteSet,
  view: "calendar" | "list" | "kanban",
): string {
  if (view === "kanban") return `${routes.root}?view=kanban`;
  if (view === "list") return `${routes.root}?view=list`;
  return routes.root;
}
