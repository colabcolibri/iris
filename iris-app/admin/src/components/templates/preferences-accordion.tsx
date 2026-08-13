import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { AppAccordion } from "@/components/templates/app-accordion";
import { cn } from "@/lib/utils";

export type PreferencesSection = {
  id: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  content: ReactNode;
};

type PreferencesAccordionProps = {
  sections: PreferencesSection[];
  defaultOpen?: string[];
  className?: string;
};

export function PreferencesAccordion({
  sections,
  defaultOpen = [],
  className,
}: PreferencesAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card
      className={cn(
        "overflow-hidden border-border bg-card p-3 shadow-none sm:p-4",
        className,
      )}
    >
      <AppAccordion multiple value={open} onValueChange={setOpen}>
        {sections.map((section) => (
          <AppAccordion.Item key={section.id} value={section.id}>
            <AppAccordion.Trigger className="text-base font-semibold">
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate">{section.title}</span>
                {section.badge}
              </span>
            </AppAccordion.Trigger>
            <AppAccordion.Content className="space-y-5 border-t border-border/50 pt-5">
              {section.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {section.description}
                </p>
              ) : null}
              {section.content}
            </AppAccordion.Content>
          </AppAccordion.Item>
        ))}
      </AppAccordion>
    </Card>
  );
}
