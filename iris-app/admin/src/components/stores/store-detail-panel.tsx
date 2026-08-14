import { Loader2, RefreshCw, Trash2, Zap } from "lucide-react";
import { PagePanel } from "@/components/templates/page-panel";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { StoreFieldPoliciesForm } from "@/components/stores/store-field-policies-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import type { FieldSource, ProductFieldKey, StoreConnection } from "@/lib/types";

const PROVIDER_LABELS: Record<StoreConnection["provider_type"], string> = {
  yampi: "Yampi",
  shopify: "Shopify",
  woocommerce: "WooCommerce",
};

type StoreDetailPanelProps = {
  connection: StoreConnection;
  fieldPolicies: Partial<Record<ProductFieldKey, FieldSource>>;
  importNewOnSync: boolean;
  busy: boolean;
  onLabelChange: (label: string) => void;
  onFieldPolicyChange: (fieldKey: ProductFieldKey, source: FieldSource) => void;
  onImportNewChange: (value: boolean) => void;
  onSave: () => void;
  onTest: () => void;
  onSync: () => void;
  onDelete: () => void;
};

export function StoreDetailPanel({
  connection,
  fieldPolicies,
  importNewOnSync,
  busy,
  onLabelChange,
  onFieldPolicyChange,
  onImportNewChange,
  onSave,
  onTest,
  onSync,
  onDelete,
}: StoreDetailPanelProps) {
  const { bcp47 } = useAppLocale();
  const storesMsg = useDomainMessages("products").stores;

  return (
    <PagePanel className="flex min-h-0 flex-1 flex-col border-0 bg-transparent md:rounded-none md:border-l md:border-border/60 md:bg-card">
      <PagePanel.Header
        title={connection.label}
        description={
          <span className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">{PROVIDER_LABELS[connection.provider_type]}</Badge>
            {connection.yampi_alias ? (
              <span className="font-mono text-xs text-muted-foreground">
                {storesMsg.detail.alias} {connection.yampi_alias}
              </span>
            ) : null}
            <span className="text-muted-foreground">
              {storesMsg.detail.status} {connection.status}
            </span>
          </span>
        }
      />
      <PagePanel.Body>
        <PageScrollArea contentClassName="space-y-6 p-4 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="store-edit-label" className="text-sm font-semibold">
              {storesMsg.detail.connectionName}
            </Label>
            <Input
              id="store-edit-label"
              value={connection.label}
              onChange={(event) => onLabelChange(event.target.value)}
              className="h-11"
            />
          </div>

          {connection.last_sync_at ? (
            <p className="text-sm text-muted-foreground">
              {storesMsg.detail.lastSync}{" "}
              {new Date(connection.last_sync_at).toLocaleString(bcp47, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          ) : null}

          {connection.last_error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {connection.last_error}
            </p>
          ) : null}

          <div className="space-y-3 rounded-lg border border-border/60 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              {storesMsg.detail.actions}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={onTest}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                {storesMsg.detail.test}
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={onSync}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                {storesMsg.detail.sync}
              </Button>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={importNewOnSync}
                onChange={(event) => onImportNewChange(event.target.checked)}
                className="size-4 rounded border-input"
              />
              {storesMsg.detail.importNewOnSync}
            </label>
          </div>

          <div className="space-y-3 rounded-lg border border-border/60 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              {storesMsg.detail.globalPolicies}
            </h3>
            <StoreFieldPoliciesForm
              values={fieldPolicies}
              disabled={busy}
              onChange={onFieldPolicyChange}
            />
          </div>
        </PageScrollArea>

        <div className="flex shrink-0 flex-wrap gap-2 border-t border-border/60 p-4 sm:px-6">
          <Button type="button" disabled={busy} onClick={onSave}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {storesMsg.detail.save}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-4" aria-hidden />
            {storesMsg.detail.delete}
          </Button>
        </div>
      </PagePanel.Body>
    </PagePanel>
  );
}
