import { Loader2, Trash2 } from "lucide-react";
import { ProductStoreSection } from "@/components/products/product-store-section";
import { PagePanel } from "@/components/templates/page-panel";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/types";

type ProductDetailPanelProps = {
  product: Product;
  saving: boolean;
  onChange: (patch: Partial<Product>) => void;
  onSave: () => void;
  onDelete: () => void;
};

export function ProductDetailPanel({
  product,
  saving,
  onChange,
  onSave,
  onDelete,
}: ProductDetailPanelProps) {
  return (
    <PagePanel className="flex min-h-0 flex-1 flex-col border-0 bg-transparent md:rounded-none md:border-l md:border-border/60 md:bg-card">
      <PagePanel.Header
        title={product.name || "Produto sem nome"}
        description={
          <span className="font-mono text-sm">{product.slug}</span>
        }
        actions={
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={product.active}
              onChange={(event) => onChange({ active: event.target.checked })}
              className="size-4 rounded border-input"
            />
            Ativo na triagem
          </label>
        }
      />
      <PagePanel.Body>
        <PageScrollArea contentClassName="space-y-5 p-4 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-edit-slug" className="text-sm font-semibold">
                Slug
              </Label>
              <Input
                id="product-edit-slug"
                value={product.slug}
                onChange={(event) => onChange({ slug: event.target.value })}
                className="h-11 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-edit-name" className="text-sm font-semibold">
                Nome
              </Label>
              <Input
                id="product-edit-name"
                value={product.name}
                onChange={(event) => onChange({ name: event.target.value })}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-short-desc" className="text-sm font-semibold">
              Descrição curta (Markdown)
            </Label>
            <Textarea
              id="product-short-desc"
              value={product.short_description}
              onChange={(event) =>
                onChange({ short_description: event.target.value })
              }
              rows={4}
              className="min-h-24 resize-y"
            />
            <p className="text-sm text-muted-foreground">
              Resumo usado na triagem quando o cliente pergunta sobre o produto.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-long-desc" className="text-sm font-semibold">
              Descrição longa (Markdown)
            </Label>
            <Textarea
              id="product-long-desc"
              value={product.long_description}
              onChange={(event) =>
                onChange({ long_description: event.target.value })
              }
              rows={8}
              className="min-h-40 resize-y"
            />
            <p className="text-sm text-muted-foreground">
              Detalhes completos injetados no contexto do agente em DMs.
            </p>
          </div>

          <ProductStoreSection productId={product.id} />
        </PageScrollArea>

        <div className="flex shrink-0 flex-wrap gap-2 border-t border-border/60 p-4 sm:px-6">
          <Button type="button" disabled={saving} onClick={onSave}>
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Salvar alterações
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-4" aria-hidden />
            Excluir produto
          </Button>
        </div>
      </PagePanel.Body>
    </PagePanel>
  );
}
