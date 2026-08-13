import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/templates/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createProduct,
  deactivateProduct,
  fetchProducts,
  updateProduct,
} from "@/lib/api";
import type { Product } from "@/lib/types";

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");

  async function loadProducts() {
    setLoading(true);
    try {
      setProducts(await fetchProducts());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  async function handleCreate() {
    if (!newSlug.trim() || !newName.trim()) {
      toast.error("Slug e nome são obrigatórios.");
      return;
    }
    setCreating(true);
    try {
      const created = await createProduct({
        slug: newSlug.trim(),
        name: newName.trim(),
      });
      setProducts((current) => [...current, created]);
      setNewSlug("");
      setNewName("");
      toast.success("Produto criado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao criar produto.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSave(product: Product) {
    setSavingId(product.id);
    try {
      const updated = await updateProduct(product.id, {
        slug: product.slug,
        name: product.name,
        short_description: product.short_description,
        long_description: product.long_description,
        active: product.active,
        sort_order: product.sort_order,
      });
      setProducts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success("Produto salvo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar produto.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeactivate(productId: string) {
    setSavingId(productId);
    try {
      await deactivateProduct(productId);
      setProducts((current) =>
        current.map((item) =>
          item.id === productId ? { ...item, active: false } : item,
        ),
      );
      toast.success("Produto desativado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao desativar.");
    } finally {
      setSavingId(null);
    }
  }

  function updateLocal(productId: string, patch: Partial<Product>) {
    setProducts((current) =>
      current.map((item) => (item.id === productId ? { ...item, ...patch } : item)),
    );
  }

  return (
    <PageContainer>
      <PageContainer.Content className="space-y-6">
        <PageContainer.Header
          eyebrow="Editorial"
          title="Produtos"
          description="Cadastro usado pelo message-harness para triagem e contexto em DMs."
        />

        <Card className="space-y-4 border-border bg-card p-6 shadow-none">
          <h2 className="text-sm font-semibold">Novo produto</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-slug">Slug</Label>
              <Input
                id="product-slug"
                value={newSlug}
                onChange={(event) => setNewSlug(event.target.value)}
                placeholder="plano-premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-name">Nome</Label>
              <Input
                id="product-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Plano premium"
              />
            </div>
          </div>
          <Button type="button" disabled={creating} onClick={() => void handleCreate()}>
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Criar produto
          </Button>
        </Card>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id} className="space-y-4 border-border bg-card p-6 shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{product.name}</h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={product.active}
                      onChange={(event) =>
                        updateLocal(product.id, { active: event.target.checked })
                      }
                    />
                    Ativo
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input
                      value={product.slug}
                      onChange={(event) =>
                        updateLocal(product.id, { slug: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={product.name}
                      onChange={(event) =>
                        updateLocal(product.id, { name: event.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição curta (Markdown)</Label>
                  <Textarea
                    value={product.short_description}
                    onChange={(event) =>
                      updateLocal(product.id, { short_description: event.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição longa (Markdown)</Label>
                  <Textarea
                    value={product.long_description}
                    onChange={(event) =>
                      updateLocal(product.id, { long_description: event.target.value })
                    }
                    rows={5}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingId === product.id}
                    onClick={() => void handleSave(product)}
                  >
                    Salvar
                  </Button>
                  {product.active ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={savingId === product.id}
                      onClick={() => void handleDeactivate(product.id)}
                    >
                      Desativar
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer.Content>
    </PageContainer>
  );
}
