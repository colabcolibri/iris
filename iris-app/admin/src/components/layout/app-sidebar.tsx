import { BrandLogo } from "@/components/layout/brand-logo";
import { AppNavigation } from "@/components/layout/app-navigation";

export type AppView = "calendar" | "kanban";

type AppSidebarProps = {
  view?: AppView;
  onViewChange?: (view: AppView) => void;
};

export function AppSidebar({ view, onViewChange }: AppSidebarProps) {
  return (
    <aside className="hidden h-full w-70 shrink-0 flex-col gap-2 border-r border-sidebar-border bg-sidebar p-4 md:flex">
      <div className="mb-6 flex items-center gap-3 px-2">
        <BrandLogo />
        <div className="min-w-0">
          <h2 className="font-display text-2xl leading-none text-sidebar-foreground">Iris</h2>
          <p className="truncate text-xs text-sidebar-foreground/60">Creative scheduler</p>
        </div>
      </div>

      <AppNavigation view={view} onViewChange={onViewChange} />
    </aside>
  );
}
