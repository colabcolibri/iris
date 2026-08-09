import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const;

type AppDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: keyof typeof SIZE_CLASS;
  children: ReactNode;
};

/** Template de composição sobre o Dialog do shadcn — não altere `components/ui`. */
export function AppDialog({ open, onOpenChange, size = "lg", children }: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          SIZE_CLASS[size],
          "flex max-h-[min(92vh,880px)] flex-col gap-0 overflow-hidden p-0",
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

type AppDialogHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
};

AppDialog.Header = function AppDialogHeader({
  title,
  description,
  children,
}: AppDialogHeaderProps) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-4 border-b bg-card px-6 py-4">
      <DialogHeader className="gap-1.5 text-left">
        <DialogTitle className="font-display text-xl font-semibold tracking-tight">
          {title}
        </DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
        {children}
      </DialogHeader>
      <DialogClose
        render={
          <Button variant="ghost" size="icon" className="shrink-0" aria-label="Fechar" />
        }
      >
        <X className="size-4" />
      </DialogClose>
    </div>
  );
};

type AppDialogBodyProps = {
  children: ReactNode;
  className?: string;
};

AppDialog.Body = function AppDialogBody({ children, className }: AppDialogBodyProps) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-x-hidden overflow-y-auto", className)}>
      <div className="min-w-0 px-6 py-5">{children}</div>
    </div>
  );
};

type AppDialogFooterProps = {
  children: ReactNode;
  className?: string;
};

AppDialog.Footer = function AppDialogFooter({ children, className }: AppDialogFooterProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/40 px-6 py-4 sm:flex-row sm:justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
};
