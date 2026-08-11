import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type PageScrollAreaProps = {
  children: ReactNode;
  /** Classes no wrapper flex (altura / flex-1). */
  className?: string;
  /** Classes no conteúdo interno (padding, gap). */
  contentClassName?: string;
  /** Classes no viewport do ScrollArea (ex.: overflow-x-hidden). */
  viewportClassName?: string;
};

/**
 * Região de scroll padrão do admin (SRP: só scroll).
 * Usa shadcn ScrollArea — não reinventar overflow-y-auto + scrollbar nativa.
 */
export function PageScrollArea({
  children,
  className,
  contentClassName,
  viewportClassName,
}: PageScrollAreaProps) {
  return (
    <div className={cn("min-h-0 min-w-0 flex-1 overflow-hidden", className)}>
      <ScrollArea
        className="h-full"
        viewportClassName={cn("!overflow-x-hidden", viewportClassName)}
      >
        <div className={cn(contentClassName)}>{children}</div>
      </ScrollArea>
    </div>
  );
}
