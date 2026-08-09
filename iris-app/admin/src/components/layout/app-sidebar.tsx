import { CalendarDays, LayoutGrid, Settings, Sparkles } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/layout/brand-logo";
import { cn } from "@/lib/utils";

export type AppView = "calendar" | "kanban";

type AppSidebarProps = {
  view?: AppView;
  onViewChange?: (view: AppView) => void;
};

const VIEW_ITEMS: { id: AppView; label: string; icon: typeof CalendarDays }[] = [
  { id: "calendar", label: "Calendário", icon: CalendarDays },
  { id: "kanban", label: "Kanban", icon: LayoutGrid },
];

const ROUTE_ITEMS = [
  { to: "/settings", label: "Configurações", icon: Settings },
  { to: "/persona", label: "Persona", icon: Sparkles },
] as const;

function routeLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
    isActive
      ? "bg-white/10 font-semibold text-sidebar-foreground"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
  );
}

export function AppSidebar({ view, onViewChange }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const onDashboard = location.pathname === "/";

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col gap-2 border-r border-sidebar-border bg-sidebar p-4 md:flex">
      <div className="mb-6 flex items-center gap-3 px-2">
        <BrandLogo />
        <div className="min-w-0">
          <h2 className="font-display text-2xl leading-none text-sidebar-foreground">Iris</h2>
          <p className="truncate text-xs text-sidebar-foreground/60">Creative scheduler</p>
        </div>
      </div>

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
                  return;
                }
                navigate(item.id === "kanban" ? "/?view=kanban" : "/");
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
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-sidebar-border pt-4">
        {ROUTE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={routeLinkClass}>
              <Icon className="size-5 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
