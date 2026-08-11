import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

const IRIS_SIDEBAR_WIDTH = "17.5rem";

type IrisSidebarProviderProps = {
  children: ReactNode;
  className?: string;
};

export function IrisSidebarProvider({ children, className }: IrisSidebarProviderProps) {
  return (
    <SidebarProvider
      defaultOpen={false}
      className={cn("flex h-svh flex-col overflow-hidden bg-background", className)}
      style={{ "--sidebar-width": IRIS_SIDEBAR_WIDTH } as CSSProperties}
    >
      {children}
    </SidebarProvider>
  );
}

type IrisSidebarProps = {
  children: ReactNode;
  className?: string;
};

export function IrisSidebar({ children, className }: IrisSidebarProps) {
  return (
    <Sidebar
      collapsible="icon"
      className={cn("top-20 h-[calc(100svh-5rem)] border-sidebar-border", className)}
    >
      <SidebarContent
        className={cn(
          "gap-2 p-4",
          "group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4",
          "group-data-[collapsible=icon]:[&_[data-sidebar=group]]:p-0",
          "group-data-[collapsible=icon]:[&_[data-sidebar=menu-item]]:flex group-data-[collapsible=icon]:[&_[data-sidebar=menu-item]]:justify-center",
          "group-data-[collapsible=icon]:[&_[data-sidebar=menu-button]]:justify-center group-data-[collapsible=icon]:[&_[data-sidebar=menu-button]]:gap-0",
          "group-data-[collapsible=icon]:[&_[data-sidebar=menu-button]>span]:hidden",
        )}
      >
        {children}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

type IrisSidebarInsetProps = {
  children: ReactNode;
  className?: string;
};

export function IrisSidebarInset({ children, className }: IrisSidebarInsetProps) {
  return (
    <SidebarInset
      className={cn("flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden", className)}
    >
      {children}
    </SidebarInset>
  );
}

type IrisSidebarTriggerProps = {
  className?: string;
};

export function IrisSidebarTrigger({ className }: IrisSidebarTriggerProps) {
  return (
    <SidebarTrigger
      className={cn("text-white hover:bg-white/10 hover:text-white", className)}
      aria-label="Alternar menu lateral"
    />
  );
}
