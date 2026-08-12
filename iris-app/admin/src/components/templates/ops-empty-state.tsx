import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type OpsEmptyStateProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

/** Empty/loading block aligned to calendar dashed utility surface. */
export function OpsEmptyState({
  title,
  children,
  className,
}: OpsEmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-4 my-6 rounded-[var(--iris-radius-lg)] border border-dashed border-border bg-muted/20 px-4 py-8 text-center sm:mx-6",
        className,
      )}
    >
      {title ? (
        <p className="font-display text-lg font-semibold text-foreground">
          {title}
        </p>
      ) : null}
      <p
        className={cn(
          "text-sm text-muted-foreground",
          title ? "mt-1" : undefined,
        )}
      >
        {children}
      </p>
    </div>
  );
}

/** Shared class for ops filter selects (Iris radius, canvas on parchment). */
export const opsFilterSelectClassName =
  "h-10 rounded-[var(--iris-radius-sm)] border border-border bg-card px-3 text-sm text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
