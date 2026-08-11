import type { ComponentProps, ReactNode } from "react";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type AppAccordionProps = ComponentProps<typeof Accordion>;

/** Template de composição sobre o Accordion do shadcn — não altere `components/ui`. */
export function AppAccordion({ className, ...props }: AppAccordionProps) {
  return (
    <Accordion
      className={cn("flex w-full flex-col gap-5", className)}
      {...props}
    />
  );
}

type AppAccordionItemProps = ComponentProps<typeof AccordionItem>;

AppAccordion.Item = function AppAccordionItem({
  className,
  ...props
}: AppAccordionItemProps) {
  return (
    <AccordionItem
      className={cn("w-full border-0 not-last:border-b-0", className)}
      {...props}
    />
  );
};

type AppAccordionTriggerProps = ComponentProps<typeof AccordionTrigger>;

AppAccordion.Trigger = function AppAccordionTrigger({
  className,
  ...props
}: AppAccordionTriggerProps) {
  return (
    <AccordionTrigger
      className={cn(
        "min-h-11 w-full items-center rounded-lg border-0 px-4 py-3.5 shadow-none",
        "bg-muted/55 text-sm font-semibold text-foreground",
        "transition-colors hover:bg-muted/75 hover:no-underline",
        "data-panel-open:bg-muted/70",
        className,
      )}
      {...props}
    />
  );
};

type AppAccordionHeaderProps = ComponentProps<typeof AccordionPrimitive.Header>;

AppAccordion.Header = function AppAccordionHeader({
  className,
  ...props
}: AppAccordionHeaderProps) {
  return (
    <AccordionPrimitive.Header className={cn("w-full", className)} {...props} />
  );
};

type AppAccordionPanelTriggerProps = ComponentProps<
  typeof AccordionPrimitive.Trigger
>;

AppAccordion.PanelTrigger = function AppAccordionPanelTrigger({
  className,
  children,
  ...props
}: AppAccordionPanelTriggerProps) {
  return (
    <AccordionPrimitive.Trigger
      render={<div />}
      nativeButton={false}
      data-slot="accordion-trigger"
      className={cn(
        "group/accordion-trigger flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left outline-none",
        "rounded-md transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      {children}
    </AccordionPrimitive.Trigger>
  );
};

type AppAccordionChevronTriggerProps = ComponentProps<
  typeof AccordionPrimitive.Trigger
>;

AppAccordion.ChevronTrigger = function AppAccordionChevronTrigger({
  className,
  ...props
}: AppAccordionChevronTriggerProps) {
  return (
    <AccordionPrimitive.Trigger
      data-slot="accordion-trigger"
      className={cn(
        "group/accordion-trigger shrink-0 self-start rounded-md p-1.5 text-muted-foreground transition-colors outline-none",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      aria-label="Expandir conversa"
      {...props}
    >
      <ChevronDownIcon className="size-4 group-aria-expanded/accordion-trigger:hidden" />
      <ChevronUpIcon className="hidden size-4 group-aria-expanded/accordion-trigger:inline" />
    </AccordionPrimitive.Trigger>
  );
};

type AppAccordionContentProps = ComponentProps<typeof AccordionContent> & {
  children: ReactNode;
};

AppAccordion.Content = function AppAccordionContent({
  className,
  ...props
}: AppAccordionContentProps) {
  return (
    <AccordionContent
      className={cn("space-y-4 px-4 pb-2 pt-4", className)}
      {...props}
    />
  );
};
