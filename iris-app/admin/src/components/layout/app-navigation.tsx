import {
  CalendarDays,
  Bot,
  FlaskConical,
  LayoutGrid,
  List,
  MessageCircle,
  MessagesSquare,
  Package,
  Send,
  Settings,
  Sparkles,
  Store,
  Webhook,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import type { AppView } from "@/components/layout/app-sidebar";
import {
  dashboardViewHref,
  useAppRoutes,
} from "@/demo/demo-routes";
import type { ShellMessages } from "@/i18n/domains/shell/types";
import { useDomainMessages } from "@/i18n/provider";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const VIEW_ITEM_DEFS: {
  id: AppView;
  navKey: keyof ShellMessages["nav"];
  icon: typeof CalendarDays;
}[] = [
  { id: "calendar", navKey: "calendar", icon: CalendarDays },
  { id: "list", navKey: "list", icon: List },
  { id: "kanban", navKey: "kanban", icon: LayoutGrid },
];

const MAIN_ROUTE_DEFS = [
  { key: "comments" as const, navKey: "comments" as const, icon: MessageCircle },
  { key: "messages" as const, navKey: "messages" as const, icon: MessagesSquare },
  { key: "products" as const, navKey: "products" as const, icon: Package },
  { key: "stores" as const, navKey: "stores" as const, icon: Store },
  { key: "webhooks" as const, navKey: "webhooks" as const, icon: Webhook },
  { key: "agentSimulator" as const, navKey: "simulator" as const, icon: FlaskConical },
  { key: "messageSimulator" as const, navKey: "messageSimulator" as const, icon: Send },
  { key: "agentRuns" as const, navKey: "agentRuns" as const, icon: Bot },
];

const FOOTER_ROUTE_DEFS = [
  { key: "settings" as const, navKey: "settings" as const, icon: Settings },
  { key: "persona" as const, navKey: "persona" as const, icon: Sparkles },
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
  const shell = useDomainMessages("shell");
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
            {VIEW_ITEM_DEFS.map((item) => {
              const active = onDashboard && view === item.id;
              const Icon = item.icon;
              const label = shell.nav[item.navKey];
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={label}
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
                    <span className={MENU_LABEL_CLASS}>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}

            {MAIN_ROUTE_DEFS.map((item) => {
              const to = routes[item.key];
              const Icon = item.icon;
              const label = shell.nav[item.navKey];
              return (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    render={<NavLink to={to} />}
                    isActive={location.pathname === to}
                    tooltip={label}
                    size="default"
                    className={MENU_BUTTON_CLASS}
                    onClick={handleNavigate}
                  >
                    <Icon />
                    <span className={MENU_LABEL_CLASS}>{label}</span>
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
                  const label = shell.nav[item.navKey];
                  return (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton
                        render={<NavLink to={to} />}
                        isActive={location.pathname === to}
                        tooltip={label}
                        size="default"
                        className={MENU_BUTTON_CLASS}
                        onClick={handleNavigate}
                      >
                        <Icon />
                        <span className={MENU_LABEL_CLASS}>{label}</span>
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
