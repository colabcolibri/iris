import { AppNavigation } from "@/components/layout/app-navigation";

export type AppView = "calendar" | "kanban";

type AppSidebarProps = {
  view?: AppView;
  onViewChange?: (view: AppView) => void;
};

export function AppSidebar({ view, onViewChange }: AppSidebarProps) {
  return (
    <aside className="hidden h-full w-70 shrink-0 flex-col gap-2 border-r border-sidebar-border bg-sidebar p-4 md:flex">
      <AppNavigation view={view} onViewChange={onViewChange} />
    </aside>
  );
}
