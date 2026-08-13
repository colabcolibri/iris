import { Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProductInboxListProps = {
  products: Product[];
  selectedId: string;
  onSelect: (productId: string) => void;
};

export function ProductInboxList({
  products,
  selectedId,
  onSelect,
}: ProductInboxListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {products.map((product) => {
        const selected = product.id === selectedId;

        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(product.id)}
            className={cn(
              "flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/40",
              selected && "bg-muted/60",
            )}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted/80 text-muted-foreground">
              <Package className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {product.name || "Sem nome"}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {product.slug}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0 text-xs font-semibold",
                    product.active
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {product.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              {product.short_description ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {product.short_description}
                </p>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

type ProductInboxNewItemProps = {
  selected: boolean;
  onSelect: () => void;
};

export function ProductInboxNewItem({
  selected,
  onSelect,
}: ProductInboxNewItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/40",
        selected && "bg-muted/60",
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted/30 text-muted-foreground">
        <Plus className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">Novo produto</p>
        <p className="text-xs text-muted-foreground">Cadastrar slug e nome</p>
      </div>
    </button>
  );
}
