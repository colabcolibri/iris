import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchProductFieldPolicies,
  fetchProductStoreLinks,
  fetchStoreConnections,
  linkProductToStore,
  unlinkProductFromStore,
  updateProductFieldPolicies,
} from "@/lib/api";
import {
  FIELD_SOURCE_LABELS,
  PRODUCT_FIELD_KEYS,
  PRODUCT_FIELD_LABELS,
} from "@/lib/product-field-keys";
import type {
  FieldSource,
  ProductFieldKey,
  ProductStoreLink,
  ResolvedProductPreview,
  StoreConnection,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type ProductStoreSectionProps = {
  productId: string;
};

type FieldOverride = FieldSource | "inherit";

function policiesToMap(
  policies: Array<{ field_key: ProductFieldKey; source: FieldSource }>,
): Partial<Record<ProductFieldKey, FieldSource>> {
  return Object.fromEntries(
    policies.map((policy) => [policy.field_key, policy.source]),
  ) as Partial<Record<ProductFieldKey, FieldSource>>;
}

function buildOverrides(
  globalPolicies: Partial<Record<ProductFieldKey, FieldSource>>,
  productPolicies: Partial<Record<ProductFieldKey, FieldSource>>,
): Record<ProductFieldKey, FieldOverride> {
  return Object.fromEntries(
    PRODUCT_FIELD_KEYS.map((fieldKey) => [
      fieldKey,
      productPolicies[fieldKey] ?? "inherit",
    ]),
  ) as Record<ProductFieldKey, FieldOverride>;
}

function PreviewRow({
  label,
  value,
  source,
  differs,
}: {
  label: string;
  value: string | null;
  source: FieldSource;
  differs?: boolean;
}) {
  if (!value && source === "disabled") {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        differs ? "border-amber-500/40 bg-amber-500/5" : "border-border/60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">
          {FIELD_SOURCE_LABELS[source]}
        </span>
      </div>
      <p className="mt-1 break-words text-muted-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

export function ProductStoreSection({ productId }: ProductStoreSectionProps) {
  const [connections, setConnections] = useState<StoreConnection[]>([]);
  const [links, setLinks] = useState<ProductStoreLink[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [externalProductId, setExternalProductId] = useState("");
  const [overrideGlobal, setOverrideGlobal] = useState(false);
  const [fieldOverrides, setFieldOverrides] = useState<
    Record<ProductFieldKey, FieldOverride>
  >(() =>
    Object.fromEntries(
      PRODUCT_FIELD_KEYS.map((key) => [key, "inherit"]),
    ) as Record<ProductFieldKey, FieldOverride>,
  );
  const [preview, setPreview] = useState<ResolvedProductPreview | null>(null);
  const [globalPolicies, setGlobalPolicies] = useState<
    Partial<Record<ProductFieldKey, FieldSource>>
  >({});

  const activeLink = useMemo(
    () => links.find((link) => link.store_connection_id === selectedConnectionId) ?? null,
    [links, selectedConnectionId],
  );

  const loadBase = useCallback(async () => {
    setLoading(true);
    try {
      const [storeConnections, storeLinks] = await Promise.all([
        fetchStoreConnections(),
        fetchProductStoreLinks(productId),
      ]);
      setConnections(storeConnections);
      setLinks(storeLinks);

      const defaultConnectionId =
        storeLinks[0]?.store_connection_id ?? storeConnections[0]?.id ?? "";
      setSelectedConnectionId((current) => current || defaultConnectionId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar lojas.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const loadPolicies = useCallback(async () => {
    if (!selectedConnectionId) {
      setPreview(null);
      setGlobalPolicies({});
      return;
    }

    try {
      const response = await fetchProductFieldPolicies(productId, selectedConnectionId);
      const globals = policiesToMap(response.global_policies);
      const products = policiesToMap(response.product_policies);
      setGlobalPolicies(globals);
      setOverrideGlobal(response.product_policies.length > 0);
      setFieldOverrides(buildOverrides(globals, products));
      setPreview(response.resolved_preview);
    } catch {
      setPreview(null);
    }
  }, [productId, selectedConnectionId]);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    void loadPolicies();
  }, [loadPolicies]);

  async function handleLink() {
    if (!selectedConnectionId || !externalProductId.trim()) {
      toast.error("Informe o ID do produto na Yampi.");
      return;
    }

    setBusy(true);
    try {
      const link = await linkProductToStore(productId, {
        store_connection_id: selectedConnectionId,
        external_product_id: externalProductId.trim(),
      });
      setLinks((current) => {
        const without = current.filter(
          (item) => item.store_connection_id !== selectedConnectionId,
        );
        return [...without, link];
      });
      setExternalProductId("");
      toast.success("Produto vinculado à loja.");
      await loadPolicies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao vincular.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlink() {
    if (!activeLink) return;
    setBusy(true);
    try {
      await unlinkProductFromStore(productId, activeLink.id);
      setLinks((current) => current.filter((item) => item.id !== activeLink.id));
      toast.success("Vínculo removido.");
      await loadPolicies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao desvincular.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSavePolicies() {
    if (!selectedConnectionId) return;
    setBusy(true);
    try {
      const policies = overrideGlobal
        ? Object.fromEntries(
            PRODUCT_FIELD_KEYS.map((fieldKey) => [
              fieldKey,
              { source: fieldOverrides[fieldKey] },
            ]),
          )
        : Object.fromEntries(
            PRODUCT_FIELD_KEYS.map((fieldKey) => [
              fieldKey,
              { source: "inherit" as const },
            ]),
          );

      await updateProductFieldPolicies(productId, {
        store_connection_id: selectedConnectionId,
        policies,
      });
      toast.success("Políticas salvas.");
      await loadPolicies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar políticas.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Carregando integração com loja…
      </p>
    );
  }

  if (connections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma loja conectada. Use a página Lojas para conectar sua Yampi.
      </p>
    );
  }

  return (
    <div className="space-y-5 rounded-lg border border-border/60 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Loja virtual</h3>
        <p className="text-sm text-muted-foreground">
          Vincule este produto ao catálogo Yampi e escolha a origem de cada campo.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Conexão</Label>
        <Select
          value={selectedConnectionId}
          onValueChange={(value) => {
            if (value) setSelectedConnectionId(value);
          }}
          disabled={busy}
        >
          <SelectTrigger className="h-10 w-full bg-background">
            <SelectValue placeholder="Selecione a loja" />
          </SelectTrigger>
          <SelectContent align="start">
            {connections.map((connection) => (
              <SelectItem key={connection.id} value={connection.id}>
                {connection.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeLink ? (
        <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3">
          <p className="text-sm font-semibold text-foreground">
            {activeLink.snapshot?.name ?? "Produto externo"}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            ID Yampi: {activeLink.external_product_id}
          </p>
          {activeLink.external_sku ? (
            <p className="text-xs text-muted-foreground">SKU: {activeLink.external_sku}</p>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            className="gap-1.5"
            onClick={() => void handleUnlink()}
          >
            <Unlink className="size-4" />
            Desvincular
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="external-product-id" className="text-sm font-semibold">
            ID do produto na Yampi
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="external-product-id"
              value={externalProductId}
              onChange={(event) => setExternalProductId(event.target.value)}
              placeholder="Ex.: 12345"
              className="h-10 font-mono"
              disabled={busy}
            />
            <Button
              type="button"
              disabled={busy}
              className="shrink-0"
              onClick={() => void handleLink()}
            >
              Vincular
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            O Iris busca os dados na Yampi ao vincular. Você também pode importar via sync na página Lojas.
          </p>
        </div>
      )}

      {activeLink ? (
        <>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={overrideGlobal}
              onChange={(event) => setOverrideGlobal(event.target.checked)}
              className="size-4 rounded border-input"
              disabled={busy}
            />
            Override por produto (em vez do padrão global da loja)
          </label>

          {overrideGlobal ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {PRODUCT_FIELD_KEYS.map((fieldKey) => (
                <div key={fieldKey} className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {PRODUCT_FIELD_LABELS[fieldKey]}
                  </Label>
                  <Select
                    value={fieldOverrides[fieldKey]}
                    onValueChange={(value) => {
                      if (
                        value === "inherit" ||
                        value === "iris" ||
                        value === "store" ||
                        value === "disabled"
                      ) {
                        setFieldOverrides((current) => ({
                          ...current,
                          [fieldKey]: value,
                        }));
                      }
                    }}
                    disabled={busy}
                  >
                    <SelectTrigger className="h-10 w-full bg-background">
                      <SelectValue>
                        {fieldOverrides[fieldKey] === "inherit"
                          ? `Padrão (${FIELD_SOURCE_LABELS[globalPolicies[fieldKey] ?? "iris"]})`
                          : FIELD_SOURCE_LABELS[fieldOverrides[fieldKey] as FieldSource]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectItem value="inherit">Padrão da loja</SelectItem>
                      {(Object.keys(FIELD_SOURCE_LABELS) as FieldSource[]).map((source) => (
                        <SelectItem key={source} value={source}>
                          {FIELD_SOURCE_LABELS[source]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          ) : null}

          <Button type="button" size="sm" disabled={busy} onClick={() => void handleSavePolicies()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar políticas de campo
          </Button>

          {preview ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Preview resolvido</h4>
              <p className="text-xs text-muted-foreground">
                Valores que o agente verá após aplicar as políticas.
              </p>
              <div className="space-y-2">
                <PreviewRow
                  label="Nome"
                  value={preview.name}
                  source={preview.fieldSources.name}
                />
                <PreviewRow
                  label="Descrição curta"
                  value={preview.shortDescription}
                  source={preview.fieldSources.short_description}
                />
                <PreviewRow
                  label="Descrição longa"
                  value={preview.longDescription}
                  source={preview.fieldSources.long_description}
                />
                <PreviewRow
                  label="Preço"
                  value={preview.price}
                  source={preview.fieldSources.price}
                  differs={Boolean(preview.price && activeLink.snapshot?.price && preview.price !== activeLink.snapshot.price)}
                />
                <PreviewRow
                  label="URL"
                  value={preview.url}
                  source={preview.fieldSources.url}
                />
                <PreviewRow
                  label="SKU"
                  value={preview.sku}
                  source={preview.fieldSources.sku}
                />
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
