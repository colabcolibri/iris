import { CalendarDays, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppView = "calendar" | "kanban";

type AppSidebarProps = {
  view: AppView;
  onViewChange: (view: AppView) => void;
};

const NAV_ITEMS: { id: AppView; label: string; icon: typeof CalendarDays }[] = [
  { id: "calendar", label: "Calendário", icon: CalendarDays },
  { id: "kanban", label: "Kanban", icon: LayoutGrid },
];

export function AppSidebar({ view, onViewChange }: AppSidebarProps) {
  return (
    <aside className="hidden w-[280px] shrink-0 flex-col gap-2 border-r border-sidebar-border bg-sidebar p-4 md:flex">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/30 text-sm font-bold text-primary-foreground">
          Ir
        </div>
        <div>
          <h2 className="font-display text-2xl leading-none text-sidebar-foreground">Iris</h2>
          <p className="text-xs text-sidebar-foreground/60">Creative scheduler</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = view === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors",
                active
                  ? "bg-primary/20 font-bold text-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
