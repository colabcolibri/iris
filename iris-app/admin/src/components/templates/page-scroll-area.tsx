import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type PageScrollAreaProps = {
  children: ReactNode;
  /** Classes no wrapper flex (altura / flex-1). */
  className?: string;
  /** Classes no conteúdo interno (padding, gap). */
  contentClassName?: string;
};

/**
 * Região de scroll do admin — composição sobre o ScrollArea shadcn.
 * Não alterar `components/ui/scroll-area`.
 */
export function PageScrollArea({
  children,
  className,
  contentClassName,
}: PageScrollAreaProps) {
  return (
    <div className={cn("min-h-0 min-w-0 flex-1 overflow-hidden", className)}>
      <ScrollArea className="h-full">
        <div className={cn(contentClassName)}>{children}</div>
      </ScrollArea>
    </div>
  );
}
