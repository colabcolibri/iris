import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type PageScrollAreaProps = {
  children: ReactNode;
  /** Classes no wrapper flex (altura / flex-1). */
  className?: string;
  /** Classes no conteúdo interno (padding, gap). */
  contentClassName?: string;
  /** Viewport rolável do ScrollArea (para scroll programático). */
  scrollViewportRef?: RefObject<HTMLDivElement | null>;
};

/**
 * Região de scroll do admin — composição sobre o ScrollArea shadcn.
 * O wrapper usa flex-1 + min-h-0; o ScrollArea preenche com absolute inset-0
 * para overflow-y funcionar em layouts split (mensagens, produtos, preferências).
 * `pe-2.5` reserva faixa para a scrollbar vertical (w-2.5) sem sobrepor o conteúdo.
 * Não alterar `components/ui/scroll-area`.
 */
export function PageScrollArea({
  children,
  className,
  contentClassName,
  scrollViewportRef,
}: PageScrollAreaProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!scrollViewportRef) {
      return;
    }

    const viewport = rootRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    scrollViewportRef.current = viewport ?? null;
  }, [scrollViewportRef]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative min-h-0 min-w-0 flex-1 overflow-hidden",
        className,
      )}
    >
      <ScrollArea className="absolute inset-0 size-full">
        <div className={cn("pe-2.5", contentClassName)}>{children}</div>
      </ScrollArea>
    </div>
  );
}
