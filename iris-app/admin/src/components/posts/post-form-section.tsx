import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PostFormSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PostFormSection({
  title,
  description,
  action,
  children,
  className,
}: PostFormSectionProps) {
  return (
    <section className={cn("w-full min-w-0 space-y-3", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </h3>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
