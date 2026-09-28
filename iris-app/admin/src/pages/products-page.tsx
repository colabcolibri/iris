import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, PanelLeft, Plus, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ProductCreatePanel } from "@/components/products/product-create-panel";
import { ProductDetailPanel } from "@/components/products/product-detail-panel";
import {
  ProductInboxList,
  ProductInboxNewItem,
} from "@/components/products/product-inbox-list";
import { PageContainer } from "@/components/templates/page-container";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import {
  OpsEmptyState,
  opsFilterSelectClassName,
} from "@/components/templates/ops-empty-state";
import { AppSheet } from "@/components/templates/app-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirmDialog } from "@/contexts/confirm-dialog-context";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from "@/lib/api";
import type { Product } from "@/lib/types";
import { interpolate } from "@/i18n/compose";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

const NEW_PRODUCT_ID = "new";

type ProductFilter = "all" | "active" | "inactive";

export function ProductsPage() {
  const { locale } = useAppLocale();
  const productsMsg = useDomainMessages("products");
  const { confirm } = useConfirmDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("product_id")?.trim() ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [listSheetOpen, setListSheetOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await fetchProducts());
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || productsMsg.toasts.loadFailed);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    let items = products;
    if (filter === "active") {
      items = items.filter((product) => product.active);
    } else if (filter === "inactive") {
      items = items.filter((product) => !product.active);
    }
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query),
    );
  }, [filter, products, searchQuery]);

  const selectProduct = useCallback(
    (productId: string) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set("product_id", productId);
        return next;
      });
      setListSheetOpen(false);
    },
    [setSearchParams],
  );

  const clearStage = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("product_id");
      return next;
    });
  }, [setSearchParams]);

  useEffect(() => {
    if (selectedId === NEW_PRODUCT_ID) {
      setDraft(null);
      return;
    }
    const product = products.find((item) => item.id === selectedId) ?? null;
    setDraft(product ? { ...product } : null);
  }, [products, selectedId]);

  async function handleCreate() {
    if (!newSlug.trim() || !newName.trim()) {
      toast.error(productsMsg.toasts.slugNameRequired);
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
      selectProduct(created.id);
      toast.success(productsMsg.toasts.created);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || productsMsg.toasts.createFailed);
    } finally {
      setCreating(false);
    }
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      const updated = await updateProduct(draft.id, {
        slug: draft.slug,
        name: draft.name,
        short_description: draft.short_description,
        long_description: draft.long_description,
        active: draft.active,
        sort_order: draft.sort_order,
      });
      setProducts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setDraft({ ...updated });
      toast.success(productsMsg.toasts.saved);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || productsMsg.toasts.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!draft) return;
    const ok = await confirm({
      title: productsMsg.confirm.delete.title,
      description: interpolate(productsMsg.confirm.delete.description, {
        name: draft.name,
      }),
      confirmLabel: productsMsg.confirm.delete.confirmLabel,
      variant: "destructive",
    });
    if (!ok) return;

    setSaving(true);
    try {
      await deleteProduct(draft.id);
      setProducts((current) => current.filter((item) => item.id !== draft.id));
      clearStage();
      toast.success(productsMsg.toasts.deleted);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || productsMsg.toasts.deleteFailed);
    } finally {
      setSaving(false);
    }
  }

  const inStage = Boolean(selectedId);

  const pageHeader = (
    <PageContainer.Header
      title={productsMsg.page.title}
      description={productsMsg.page.description}
    />
  );

  const listControls = (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as ProductFilter)}
          className={cn(opsFilterSelectClassName, "min-w-0 flex-1")}
          aria-label={productsMsg.page.filterAria}
        >
          <option value="all">{productsMsg.filters.all}</option>
          <option value="active">{productsMsg.filters.active}</option>
          <option value="inactive">{productsMsg.filters.inactive}</option>
        </select>
        <Button
          type="button"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => selectProduct(NEW_PRODUCT_ID)}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">{productsMsg.page.new}</span>
        </Button>
      </div>
      <div className="relative w-full min-w-0">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={productsMsg.page.searchPlaceholder}
          className="h-9 pl-10 text-sm focus-visible:ring-primary/40"
        />
      </div>
    </div>
  );

  const listBody = loading ? (
    <OpsEmptyState>{productsMsg.page.loading}</OpsEmptyState>
  ) : (
    <>
      <ProductInboxNewItem
        selected={selectedId === NEW_PRODUCT_ID}
        onSelect={() => selectProduct(NEW_PRODUCT_ID)}
      />
      {filteredProducts.length === 0 ? (
        <OpsEmptyState title={productsMsg.empty.title}>
          {products.length === 0
            ? productsMsg.empty.noProducts
            : productsMsg.empty.noResults}
        </OpsEmptyState>
      ) : (
        <ProductInboxList
          products={filteredProducts}
          selectedId={selectedId}
          onSelect={selectProduct}
        />
      )}
    </>
  );

  const detailBody =
    selectedId === NEW_PRODUCT_ID ? (
      <ProductCreatePanel
        slug={newSlug}
        name={newName}
        creating={creating}
        onSlugChange={setNewSlug}
        onNameChange={setNewName}
        onSubmit={() => void handleCreate()}
      />
    ) : draft ? (
      <ProductDetailPanel
        product={draft}
        saving={saving}
        onChange={(patch) => setDraft((current) => (current ? { ...current, ...patch } : current))}
        onSave={() => void handleSave()}
        onDelete={() => void handleDelete()}
      />
    ) : selectedId ? (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        {productsMsg.page.loadingProduct}
      </div>
    ) : (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <OpsEmptyState title={productsMsg.page.selectProductTitle}>
          {productsMsg.page.selectProductBody}
        </OpsEmptyState>
      </div>
    );

  return (
    <PageContainer variant="fill">
      <PageContainer.Content width="full" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border/60 px-4 py-4 sm:px-6">
            {pageHeader}
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <aside
              className={cn(
                "flex min-h-0 flex-col overflow-hidden border-border/60 md:w-[30%] md:min-w-70 md:max-w-sm md:shrink-0 md:border-r",
                inStage ? "hidden md:flex" : "flex w-full flex-1",
              )}
            >
              <div className="shrink-0 border-b border-border/60 p-3">{listControls}</div>
              <PageScrollArea className="min-h-0 flex-1 bg-transparent">
                {listBody}
              </PageScrollArea>
            </aside>

            <main
              className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
                inStage ? "w-full md:w-[70%]" : "hidden md:flex",
              )}
            >
            {inStage ? (
              <>
                <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2 md:hidden">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="min-h-10 gap-2"
                    onClick={clearStage}
                  >
                    <ArrowLeft className="size-4" />
                    {productsMsg.page.back}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-10"
                    onClick={() => setListSheetOpen(true)}
                  >
                    <PanelLeft className="size-4" />
                  </Button>
                </div>
                {detailBody}
              </>
            ) : (
              detailBody
            )}
            </main>
          </div>
        </div>
      </PageContainer.Content>

      <AppSheet open={listSheetOpen} onOpenChange={setListSheetOpen} side="left" size="md">
        <AppSheet.Header title={productsMsg.page.sheetTitle} />
        <div className="shrink-0 border-b p-3">{listControls}</div>
        <AppSheet.Body scroll={false}>
          <PageScrollArea className="min-h-0 flex-1">{listBody}</PageScrollArea>
        </AppSheet.Body>
      </AppSheet>
    </PageContainer>
  );
}
