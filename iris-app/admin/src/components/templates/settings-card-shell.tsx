import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SettingsCardShellProps = {
  title: string;
  description?: string;
  /** Quando true, omite o Card e o cabeçalho (uso dentro de PreferencesSplitLayout). */
  embedded?: boolean;
  className?: string;
  children: ReactNode;
};

export function SettingsCardShell({
  title,
  description,
  embedded = false,
  className,
  children,
}: SettingsCardShellProps) {
  if (embedded) {
    return <div className={cn("space-y-5", className)}>{children}</div>;
  }

  return (
    <Card
      className={cn(
        "space-y-5 border-border bg-card p-6 shadow-none",
        className,
      )}
    >
      <header className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </Card>
  );
}
