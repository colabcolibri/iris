import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { cn } from "@/lib/utils";
import type { PostStatus } from "@/lib/types";

const COLUMN_THEME: Record<
  PostStatus,
  { headerAccent?: string; muted?: boolean }
> = {
  draft: {},
  scheduled: {},
  published: {},
  monitored: { headerAccent: "text-amber-800" },
  failed: { headerAccent: "text-destructive" },
  cancelled: { muted: true },
};

type KanbanColumnShellProps = {
  status: PostStatus;
  label: string;
  count: number;
  children: ReactNode;
};

export function KanbanColumnShell({
  status,
  label,
  count,
  children,
}: KanbanColumnShellProps) {
  const theme = COLUMN_THEME[status];

  return (
    <section
      className={cn(
        "flex h-full w-[320px] shrink-0 flex-col rounded-[var(--iris-radius-lg)] border border-border bg-muted/60 shadow-none",
        theme.muted && "opacity-80",
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 rounded-t-[var(--iris-radius-lg)] border-b border-border bg-card px-4 py-4">
        <h3
          className={cn(
            "flex items-center gap-2 text-sm font-semibold tracking-widest text-foreground uppercase",
            theme.headerAccent,
          )}
        >
          {label}
          {status === "failed" && <AlertCircle className="size-4" />}
        </h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-sm font-semibold text-secondary-foreground">
          {count}
        </span>
      </header>

      <PageScrollArea contentClassName="flex flex-col gap-4 p-4">
        {children}
      </PageScrollArea>
    </section>
  );
}

type KanbanCardShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  onOpen: () => void;
  className?: string;
  variant?: "default" | "failed";
};

KanbanColumnShell.Card = function KanbanCardShell({
  children,
  footer,
  onOpen,
  className,
  variant = "default",
}: KanbanCardShellProps) {
  return (
    <article
      className={cn(
        "group rounded-[var(--iris-radius-lg)] border border-border bg-card shadow-none transition-colors hover:border-primary/30",
        variant === "failed" &&
          "relative overflow-hidden border-destructive/30 bg-destructive/5",
        className,
      )}
    >
      {variant === "failed" && (
        <div
          className="absolute top-0 bottom-0 left-0 w-1 bg-destructive"
          aria-hidden
        />
      )}
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "w-full rounded-t-[var(--iris-radius-lg)] px-4 pt-4 pb-2 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          variant === "failed" && "pl-5",
        )}
      >
        {children}
      </button>
      {footer ? (
        <div className="flex items-center justify-end border-t border-border px-2 py-1.5">
          {footer}
        </div>
      ) : null}
    </article>
  );
};

type KanbanColumnEmptyProps = {
  message?: string;
};

KanbanColumnShell.Empty = function KanbanColumnEmpty({
  message = "Nenhuma postagem",
}: KanbanColumnEmptyProps) {
  return (
    <div className="flex min-h-24 items-center justify-center rounded-[var(--iris-radius-lg)] border border-dashed border-border bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground italic">
      {message}
    </div>
  );
};
