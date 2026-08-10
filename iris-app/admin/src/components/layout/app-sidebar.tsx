import { AppNavigation } from "@/components/layout/app-navigation";
import { IrisSidebar } from "@/components/layout/iris-sidebar";

export type AppView = "calendar" | "kanban";

type AppSidebarProps = {
  view?: AppView;
  onViewChange?: (view: AppView) => void;
};

export function AppSidebar({ view, onViewChange }: AppSidebarProps) {
  return (
    <IrisSidebar>
      <AppNavigation view={view} onViewChange={onViewChange} />
    </IrisSidebar>
  );
}
