import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar, type AppView } from "@/components/layout/app-sidebar";
import type { MetaStatus } from "@/lib/types";

type AppShellProps = {
  meta: MetaStatus | null;
  onDisconnectMeta?: () => Promise<boolean>;
  onNewPost?: () => void;
  onMetaHealth?: () => void;
  sidebarView?: AppView;
  onSidebarViewChange?: (view: AppView) => void;
  children: ReactNode;
};

export function AppShell({
  meta,
  onDisconnectMeta,
  onNewPost,
  onMetaHealth,
  sidebarView,
  onSidebarViewChange,
  children,
}: AppShellProps) {
  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <AppHeader
        meta={meta}
        onNewPost={onNewPost ?? (() => undefined)}
        onDisconnectMeta={onDisconnectMeta}
        onMetaHealth={onMetaHealth}
        sidebarView={sidebarView}
        onSidebarViewChange={onSidebarViewChange}
      />

      <div className="flex min-h-0 flex-1">
        <AppSidebar view={sidebarView} onViewChange={onSidebarViewChange} />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
