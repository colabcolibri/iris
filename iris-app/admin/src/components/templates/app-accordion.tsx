import type { ComponentProps, ReactNode } from "react";
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
  return <Accordion className={cn("flex w-full flex-col gap-5", className)} {...props} />;
}

type AppAccordionItemProps = ComponentProps<typeof AccordionItem>;

AppAccordion.Item = function AppAccordionItem({ className, ...props }: AppAccordionItemProps) {
  return (
    <AccordionItem className={cn("w-full border-0 not-last:border-b-0", className)} {...props} />
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

type AppAccordionContentProps = ComponentProps<typeof AccordionContent> & {
  children: ReactNode;
};

AppAccordion.Content = function AppAccordionContent({
  className,
  ...props
}: AppAccordionContentProps) {
  return <AccordionContent className={cn("space-y-4 px-4 pb-2 pt-4", className)} {...props} />;
};
