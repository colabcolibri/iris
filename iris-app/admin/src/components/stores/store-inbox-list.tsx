import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StoreConnection } from "@/lib/types";
import { cn } from "@/lib/utils";

const PROVIDER_LABELS: Record<StoreConnection["provider_type"], string> = {
  yampi: "Yampi",
  shopify: "Shopify",
  woocommerce: "WooCommerce",
};

const STATUS_LABELS: Record<StoreConnection["status"], string> = {
  active: "Ativa",
  error: "Erro",
  disconnected: "Desconectada",
};

type StoreInboxListProps = {
  connections: StoreConnection[];
  selectedId: string;
  onSelect: (connectionId: string) => void;
};

export function StoreInboxList({
  connections,
  selectedId,
  onSelect,
}: StoreInboxListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {connections.map((connection) => {
        const selected = connection.id === selectedId;

        return (
          <button
            key={connection.id}
            type="button"
            onClick={() => onSelect(connection.id)}
            className={cn(
              "flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/40",
              selected && "bg-muted/60",
            )}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted/80 text-muted-foreground">
              <Store className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {connection.label}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {PROVIDER_LABELS[connection.provider_type]}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0 text-xs font-semibold",
                    connection.status === "active"
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                      : connection.status === "error"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {STATUS_LABELS[connection.status]}
                </Badge>
              </div>
              {connection.last_sync_at ? (
                <p className="text-xs text-muted-foreground">
                  Sync:{" "}
                  {new Date(connection.last_sync_at).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Nunca sincronizado</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
