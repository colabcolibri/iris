import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "data-[swipe-axis=x]:sm:[--drawer-content-width:24rem]!",
  md: "data-[swipe-axis=x]:sm:[--drawer-content-width:28rem]!",
  lg: "data-[swipe-axis=x]:sm:[--drawer-content-width:32rem]!",
} as const;

type AppSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "right" | "left";
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  children: ReactNode;
};

/** Painel do admin. No celular sobe de baixo; no desktop entra pela lateral. */
export function AppSheet({
  open,
  onOpenChange,
  side = "right",
  size = "md",
  className,
  children,
}: AppSheetProps) {
  const isMobile = useIsMobile();

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : side}
    >
      <DrawerContent
        className={cn(
          SIZE_CLASS[size],
          "gap-0 overflow-hidden p-0 data-[swipe-axis=x]:[--drawer-content-height:100dvh]! data-[swipe-axis=y]:[--drawer-content-height:min(85dvh,100dvh)]!",
          className,
        )}
      >
        {children}
      </DrawerContent>
    </Drawer>
  );
}

type AppSheetHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  closeLabel?: string;
};

AppSheet.Header = function AppSheetHeader({
  title,
  description,
  closeLabel = "Fechar",
}: AppSheetHeaderProps) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-4 border-b bg-card px-4 py-4 sm:px-6">
      <div className="min-w-0 flex-1 space-y-1.5 text-left">
        <DrawerTitle className="font-display text-xl font-semibold tracking-tight">
          {title}
        </DrawerTitle>
        {description ? (
          <DrawerDescription className="text-sm leading-relaxed">
            {description}
          </DrawerDescription>
        ) : null}
      </div>
      <DrawerClose
        render={
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label={closeLabel}
          />
        }
      >
        <X className="size-4" />
      </DrawerClose>
    </div>
  );
};

type AppSheetBodyProps = {
  children: ReactNode;
  className?: string;
  /** Listas já trazem o PageScrollArea. Formulários rolam aqui. */
  scroll?: boolean;
};

AppSheet.Body = function AppSheetBody({
  children,
  className,
  scroll = true,
}: AppSheetBodyProps) {
  if (!scroll) {
    return (
      <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className={cn("min-w-0 px-4 py-5 sm:px-6", className)}>{children}</div>
      </ScrollArea>
    </div>
  );
};

type AppSheetFooterProps = {
  children: ReactNode;
  className?: string;
};

AppSheet.Footer = function AppSheetFooter({ children, className }: AppSheetFooterProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/60 px-4 py-4 sm:flex-row sm:justify-end sm:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
};
