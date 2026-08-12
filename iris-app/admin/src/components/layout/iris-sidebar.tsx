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
/** h-14 — altura do AppHeader */
const IRIS_HEADER_HEIGHT = "3.5rem";
/** h-10 — altura do DemoBanner */
const IRIS_DEMO_BANNER_HEIGHT = "2.5rem";

type IrisSidebarProviderProps = {
  children: ReactNode;
  className?: string;
  demoChrome?: boolean;
};

export function IrisSidebarProvider({
  children,
  className,
  demoChrome = false,
}: IrisSidebarProviderProps) {
  const chromeTop = demoChrome
    ? `calc(${IRIS_DEMO_BANNER_HEIGHT} + ${IRIS_HEADER_HEIGHT})`
    : IRIS_HEADER_HEIGHT;

  return (
    <SidebarProvider
      defaultOpen={false}
      className={cn(
        "flex h-svh flex-col overflow-hidden bg-background",
        className,
      )}
      style={
        {
          "--sidebar-width": IRIS_SIDEBAR_WIDTH,
          "--iris-chrome-top": chromeTop,
        } as CSSProperties
      }
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
      className={cn(
        "top-[var(--iris-chrome-top,3.5rem)] h-[calc(100svh-var(--iris-chrome-top,3.5rem))] border-sidebar-border bg-sidebar shadow-none",
        className,
      )}
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

export function IrisSidebarInset({
  children,
  className,
}: IrisSidebarInsetProps) {
  return (
    <SidebarInset
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
        className,
      )}
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
      className={cn(
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground size-11",
        className,
      )}
      aria-label="Alternar menu lateral"
    />
  );
}
