import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PagePanelProps = {
  children: ReactNode;
  className?: string;
};

/** Template de painel principal — ocupa o espaço disponível na página. */
export function PagePanel({ children, className }: PagePanelProps) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--iris-radius-lg)] border border-border bg-card shadow-none",
        className,
      )}
    >
      {children}
    </section>
  );
}

type PagePanelHeaderProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

PagePanel.Header = function PagePanelHeader({
  title,
  description,
  actions,
  children,
}: PagePanelHeaderProps) {
  return (
    <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
      <div className="space-y-1">
        {title ? (
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
};

type PagePanelBodyProps = {
  children: ReactNode;
  className?: string;
};

PagePanel.Body = function PagePanelBody({
  children,
  className,
}: PagePanelBodyProps) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      {children}
    </div>
  );
};
