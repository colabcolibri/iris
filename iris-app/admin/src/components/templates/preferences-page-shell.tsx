import type { ReactNode } from "react";
import { PageContainer } from "@/components/templates/page-container";
import { PageScrollArea } from "@/components/templates/page-scroll-area";

type PreferencesPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

/** Layout full-width para páginas de preferências (mesmo padrão de webhooks). */
export function PreferencesPageShell({
  eyebrow,
  title,
  description,
  children,
}: PreferencesPageShellProps) {
  return (
    <PageContainer variant="fill">
      <PageContainer.Content width="full">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border/60 px-4 py-4 sm:px-6 md:px-8">
            <PageContainer.Header
              eyebrow={eyebrow}
              title={title}
              description={description}
            />
          </div>
          <PageScrollArea contentClassName="px-4 py-6 sm:px-6 md:px-8">
            <div className="w-full">{children}</div>
          </PageScrollArea>
        </div>
      </PageContainer.Content>
    </PageContainer>
  );
}
