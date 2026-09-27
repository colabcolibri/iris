import type { ReactNode } from "react";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  /** scroll: página com rolagem vertical; fill: ocupa altura disponível sem scroll externo */
  variant?: "scroll" | "fill";
  className?: string;
};

/** Wrapper externo padrão das páginas autenticadas (padding, scroll, altura). */
export function PageContainer({
  children,
  variant = "scroll",
  className,
}: PageContainerProps) {
  if (variant === "scroll") {
    return (
      <PageScrollArea
        className={cn("min-w-0", className)}
        contentClassName="px-4 py-6 sm:px-6 md:px-10 md:py-8"
      >
        {children}
      </PageScrollArea>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

type PageContainerContentProps = {
  children: ReactNode;
  /** narrow: formulários e preferências; full: layouts split (inbox, kanban) */
  width?: "narrow" | "full";
  className?: string;
};

PageContainer.Content = function PageContainerContent({
  children,
  width = "narrow",
  className,
}: PageContainerContentProps) {
  return (
    <div
      className={cn(
        width === "narrow" && "mx-auto w-full max-w-2xl space-y-6",
        width === "full" && "flex min-h-0 min-w-0 flex-1 flex-col",
        className,
      )}
    >
      {children}
    </div>
  );
};

type PageContainerHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

PageContainer.Header = function PageContainerHeader({
  title,
  description,
  actions,
  className,
}: PageContainerHeaderProps) {
  return (
    <header
      className={cn(
        "space-y-1",
        actions && "flex flex-wrap items-start justify-between gap-3",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="font-display text-xl font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
};
