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
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  fetchProductFieldPolicies,
  fetchProductStoreLinks,
  fetchStoreConnections,
  linkProductToStore,
  unlinkProductFromStore,
  updateProductFieldPolicies,
} from "@/lib/api";
import { PRODUCT_FIELD_KEYS } from "@/lib/product-field-keys";
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

const FIELD_MESSAGE_KEYS = {
  name: "name",
  short_description: "shortDescription",
  long_description: "longDescription",
  price: "price",
  url: "url",
  image_url: "imageUrl",
  sku: "sku",
} as const;

function policiesToMap(
  policies: Array<{ field_key: ProductFieldKey; source: FieldSource }>,
): Partial<Record<ProductFieldKey, FieldSource>> {
  return Object.fromEntries(
    policies.map((policy) => [policy.field_key, policy.source]),
  ) as Partial<Record<ProductFieldKey, FieldSource>>;
}

function buildOverrides(
  _globalPolicies: Partial<Record<ProductFieldKey, FieldSource>>,
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
  sourceLabel,
  differs,
}: {
  label: string;
  value: string | null;
  source: FieldSource;
  sourceLabel: string;
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
        <span className="text-xs text-muted-foreground">{sourceLabel}</span>
      </div>
      <p className="mt-1 wrap-break-word text-muted-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

export function ProductStoreSection({ productId }: ProductStoreSectionProps) {
  const { locale } = useAppLocale();
  const productsMsg = useDomainMessages("products");
  const storeMsg = productsMsg.store;
  const fieldSources = productsMsg.fieldSources;
  const fieldLabels = storeMsg.fields;

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

  function fieldLabel(fieldKey: ProductFieldKey): string {
    const key = FIELD_MESSAGE_KEYS[fieldKey];
    return fieldLabels[key as keyof typeof fieldLabels] ?? fieldKey;
  }

  function inheritLabel(source: FieldSource): string {
    return storeMsg.inheritWithSource.replace("{source}", fieldSources[source]);
  }

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
      toast.error(
        getApiErrorMessage(err, locale) || productsMsg.toasts.storesLoadFailed,
      );
    } finally {
      setLoading(false);
    }
  }, [locale, productId, productsMsg.toasts.storesLoadFailed]);

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
      toast.error(productsMsg.toasts.externalIdRequired);
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
      toast.success(productsMsg.toasts.linked);
      await loadPolicies();
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || productsMsg.toasts.linkFailed);
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
      toast.success(productsMsg.toasts.unlinked);
      await loadPolicies();
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || productsMsg.toasts.unlinkFailed);
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
      toast.success(productsMsg.toasts.policiesSaved);
      await loadPolicies();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, locale) || productsMsg.toasts.policiesFailed,
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {storeMsg.loadingIntegration}
      </p>
    );
  }

  if (connections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{storeMsg.storePageHint}</p>
    );
  }

  return (
    <div className="space-y-5 rounded-lg border border-border/60 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{storeMsg.title}</h3>
        <p className="text-sm text-muted-foreground">{storeMsg.storeDescription}</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">{storeMsg.connectionLabel}</Label>
        <Select
          value={selectedConnectionId}
          onValueChange={(value) => {
            if (value) setSelectedConnectionId(value);
          }}
          disabled={busy}
        >
          <SelectTrigger className="h-10 w-full bg-background">
            <SelectValue placeholder={storeMsg.selectStore} />
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
            {activeLink.snapshot?.name ?? storeMsg.externalFallback}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {storeMsg.yampiIdLabel} {activeLink.external_product_id}
          </p>
          {activeLink.external_sku ? (
            <p className="text-xs text-muted-foreground">
              {storeMsg.sku.replace("{sku}", activeLink.external_sku)}
            </p>
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
            {storeMsg.unlink}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="external-product-id" className="text-sm font-semibold">
            {storeMsg.externalProductLabel}
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="external-product-id"
              value={externalProductId}
              onChange={(event) => setExternalProductId(event.target.value)}
              placeholder={storeMsg.externalProductPlaceholder}
              className="h-10 font-mono"
              disabled={busy}
            />
            <Button
              type="button"
              disabled={busy}
              className="shrink-0"
              onClick={() => void handleLink()}
            >
              {storeMsg.link}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{storeMsg.linkExtendedHint}</p>
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
            {storeMsg.overrideCheckbox}
          </label>

          {overrideGlobal ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {PRODUCT_FIELD_KEYS.map((fieldKey) => (
                <div key={fieldKey} className="space-y-2">
                  <Label className="text-sm font-semibold">{fieldLabel(fieldKey)}</Label>
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
                          ? inheritLabel(globalPolicies[fieldKey] ?? "iris")
                          : fieldSources[fieldOverrides[fieldKey] as FieldSource]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectItem value="inherit">{storeMsg.inheritDefault}</SelectItem>
                      {(Object.keys(fieldSources) as FieldSource[]).map((source) => (
                        <SelectItem key={source} value={source}>
                          {fieldSources[source]}
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
            {storeMsg.savePoliciesButton}
          </Button>

          {preview ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">
                {storeMsg.resolvedPreviewTitle}
              </h4>
              <p className="text-xs text-muted-foreground">
                {storeMsg.resolvedPreviewAgentHint}
              </p>
              <div className="space-y-2">
                <PreviewRow
                  label={fieldLabels.name}
                  value={preview.name}
                  source={preview.fieldSources.name}
                  sourceLabel={fieldSources[preview.fieldSources.name]}
                />
                <PreviewRow
                  label={fieldLabels.shortDescription}
                  value={preview.shortDescription}
                  source={preview.fieldSources.short_description}
                  sourceLabel={fieldSources[preview.fieldSources.short_description]}
                />
                <PreviewRow
                  label={fieldLabels.longDescription}
                  value={preview.longDescription}
                  source={preview.fieldSources.long_description}
                  sourceLabel={fieldSources[preview.fieldSources.long_description]}
                />
                <PreviewRow
                  label={fieldLabels.price}
                  value={preview.price}
                  source={preview.fieldSources.price}
                  sourceLabel={fieldSources[preview.fieldSources.price]}
                  differs={Boolean(preview.price && activeLink.snapshot?.price && preview.price !== activeLink.snapshot.price)}
                />
                <PreviewRow
                  label={fieldLabels.url}
                  value={preview.url}
                  source={preview.fieldSources.url}
                  sourceLabel={fieldSources[preview.fieldSources.url]}
                />
                <PreviewRow
                  label={fieldLabels.sku}
                  value={preview.sku}
                  source={preview.fieldSources.sku}
                  sourceLabel={fieldSources[preview.fieldSources.sku]}
                />
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
