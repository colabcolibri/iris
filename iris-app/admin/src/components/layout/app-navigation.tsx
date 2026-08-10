import { CalendarDays, LayoutGrid, MessageCircle, Settings, Sparkles, Webhook } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import type { AppView } from "@/components/layout/app-sidebar";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const VIEW_ITEMS: { id: AppView; label: string; icon: typeof CalendarDays }[] = [
  { id: "calendar", label: "Calendário", icon: CalendarDays },
  { id: "kanban", label: "Kanban", icon: LayoutGrid },
];

const MAIN_ROUTE_ITEMS = [
  { to: "/comments", label: "Comentários", icon: MessageCircle },
  { to: "/webhooks", label: "Webhooks", icon: Webhook },
] as const;

const FOOTER_ROUTE_ITEMS = [
  { to: "/settings", label: "Configurações", icon: Settings },
  { to: "/persona", label: "Persona", icon: Sparkles },
] as const;

const MENU_BUTTON_CLASS =
  "h-12 text-sidebar-foreground/70 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 data-active:bg-primary/25 data-active:font-semibold data-active:text-sidebar-foreground";

const MENU_LABEL_CLASS = "group-data-[collapsible=icon]:hidden";

type AppNavigationProps = {
  view?: AppView;
  onViewChange?: (view: AppView) => void;
  onNavigate?: () => void;
  showFooter?: boolean;
};

export function AppNavigation({
  view,
  onViewChange,
  onNavigate,
  showFooter = true,
}: AppNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const onDashboard = location.pathname === "/";

  function handleNavigate() {
    onNavigate?.();
    setOpenMobile(false);
  }

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:p-0">
        <SidebarGroupContent>
          <SidebarMenu>
            {VIEW_ITEMS.map((item) => {
              const active = onDashboard && view === item.id;
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={item.label}
                    size="default"
                    className={MENU_BUTTON_CLASS}
                    onClick={() => {
                      if (onDashboard && onViewChange) {
                        onViewChange(item.id);
                      } else {
                        navigate(item.id === "kanban" ? "/?view=kanban" : "/");
                      }
                      handleNavigate();
                    }}
                  >
                    <Icon />
                    <span className={MENU_LABEL_CLASS}>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}

            {MAIN_ROUTE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    render={<NavLink to={item.to} />}
                    isActive={location.pathname === item.to}
                    tooltip={item.label}
                    size="default"
                    className={MENU_BUTTON_CLASS}
                    onClick={handleNavigate}
                  >
                    <Icon />
                    <span className={MENU_LABEL_CLASS}>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {showFooter ? (
        <>
          <SidebarSeparator className="mx-0 bg-sidebar-border group-data-[collapsible=icon]:mx-2" />
          <SidebarGroup className="mt-auto group-data-[collapsible=icon]:p-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {FOOTER_ROUTE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        render={<NavLink to={item.to} />}
                        isActive={location.pathname === item.to}
                        tooltip={item.label}
                        size="default"
                        className={MENU_BUTTON_CLASS}
                        onClick={handleNavigate}
                      >
                        <Icon />
                        <span className={MENU_LABEL_CLASS}>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </>
      ) : null}
    </>
  );
}
