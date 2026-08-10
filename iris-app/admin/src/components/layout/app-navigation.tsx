import { CalendarDays, LayoutGrid, MessageCircle, Settings, Sparkles } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { AppView } from "@/components/layout/app-sidebar";

const VIEW_ITEMS: { id: AppView; label: string; icon: typeof CalendarDays }[] = [
  { id: "calendar", label: "Calendário", icon: CalendarDays },
  { id: "kanban", label: "Kanban", icon: LayoutGrid },
];

const ROUTE_ITEMS = [
  { to: "/comments", label: "Comentários", icon: MessageCircle },
  { to: "/settings", label: "Configurações", icon: Settings },
  { to: "/persona", label: "Persona", icon: Sparkles },
] as const;

function routeLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary/25 font-semibold text-sidebar-foreground"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
  );
}

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
  const onDashboard = location.pathname === "/";

  return (
    <>
      <nav className="flex flex-col gap-1">
        {VIEW_ITEMS.map((item) => {
          const active = onDashboard && view === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (onDashboard && onViewChange) {
                  onViewChange(item.id);
                } else {
                  navigate(item.id === "kanban" ? "/?view=kanban" : "/");
                }
                onNavigate?.();
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/25 font-semibold text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </button>
          );
        })}

        {ROUTE_ITEMS.slice(0, 1).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={routeLinkClass}
              onClick={() => onNavigate?.()}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {showFooter && (
        <div className="mt-auto flex flex-col gap-1 border-t border-sidebar-border pt-4">
          {ROUTE_ITEMS.slice(1).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={routeLinkClass}
                onClick={() => onNavigate?.()}
              >
                <Icon className="size-5 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </>
  );
}
