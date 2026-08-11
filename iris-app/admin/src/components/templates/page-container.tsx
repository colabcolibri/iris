import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  /** scroll: página com rolagem vertical; fill: ocupa altura disponível sem scroll externo */
  variant?: "scroll" | "fill";
  className?: string;
};

/** Wrapper externo padrão das páginas autenticadas (padding, scroll, altura). */
export function PageContainer({ children, variant = "scroll", className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "min-w-0",
        variant === "scroll"
          ? "flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 md:px-10 md:py-8"
          : "flex min-h-0 flex-1 flex-col overflow-hidden",
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
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

PageContainer.Header = function PageContainerHeader({
  eyebrow,
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
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-[34px] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-[17px] leading-[1.47] tracking-[-0.374px] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
};
