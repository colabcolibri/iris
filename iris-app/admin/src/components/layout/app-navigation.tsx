import {
  CalendarDays,
  Bot,
  FlaskConical,
  LayoutGrid,
  List,
  MessageCircle,
  Settings,
  Sparkles,
  Webhook,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import type { AppView } from "@/components/layout/app-sidebar";
import {
  dashboardViewHref,
  useAppRoutes,
} from "@/demo/demo-routes";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const VIEW_ITEMS: { id: AppView; label: string; icon: typeof CalendarDays }[] =
  [
    { id: "calendar", label: "Calendário", icon: CalendarDays },
    { id: "list", label: "Lista", icon: List },
    { id: "kanban", label: "Kanban", icon: LayoutGrid },
  ];

const MAIN_ROUTE_DEFS = [
  { key: "comments" as const, label: "Comentários", icon: MessageCircle },
  { key: "webhooks" as const, label: "Webhooks", icon: Webhook },
  { key: "agentSimulator" as const, label: "Simulador", icon: FlaskConical },
  { key: "agentRuns" as const, label: "Execuções", icon: Bot },
];

const FOOTER_ROUTE_DEFS = [
  { key: "settings" as const, label: "Configurações", icon: Settings },
  { key: "persona" as const, label: "Persona", icon: Sparkles },
];

const MENU_BUTTON_CLASS =
  "h-11 min-h-11 text-xs font-normal text-sidebar-foreground/70 transition-transform active:scale-95 group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 data-active:bg-sidebar-accent data-active:font-semibold data-active:text-sidebar-primary data-active:shadow-none";

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
  const routes = useAppRoutes();
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const onDashboard = location.pathname === routes.root;

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
                        navigate(dashboardViewHref(routes, item.id));
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

            {MAIN_ROUTE_DEFS.map((item) => {
              const to = routes[item.key];
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    render={<NavLink to={to} />}
                    isActive={location.pathname === to}
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
                {FOOTER_ROUTE_DEFS.map((item) => {
                  const to = routes[item.key];
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton
                        render={<NavLink to={to} />}
                        isActive={location.pathname === to}
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
