import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, PanelLeft, Plus, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { StoreCreatePanel, StoreInboxNewItem } from "@/components/stores/store-create-panel";
import { StoreDetailPanel } from "@/components/stores/store-detail-panel";
import { StoreInboxList } from "@/components/stores/store-inbox-list";
import { PageContainer } from "@/components/templates/page-container";
import { OpsEmptyState } from "@/components/templates/ops-empty-state";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { AppSheet } from "@/components/templates/app-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirmDialog } from "@/contexts/confirm-dialog-context";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  createStoreConnection,
  deleteStoreConnection,
  discoverYampiMerchants,
  fetchStoreConnections,
  fetchStoreFieldPolicies,
  syncStoreConnection,
  testStoreConnection,
  updateStoreConnection,
  updateStoreFieldPolicies,
} from "@/lib/api";
import type { FieldSource, ProductFieldKey, StoreConnection, YampiMerchantOption } from "@/lib/types";
import { cn } from "@/lib/utils";

const NEW_STORE_ID = "__new__";

function policiesToMap(
  policies: Array<{ field_key: ProductFieldKey; source: FieldSource }>,
): Partial<Record<ProductFieldKey, FieldSource>> {
  return Object.fromEntries(
    policies.map((policy) => [policy.field_key, policy.source]),
  ) as Partial<Record<ProductFieldKey, FieldSource>>;
}

export function StoresPage() {
  const { confirm } = useConfirmDialog();
  const { locale } = useAppLocale();
  const productsMsg = useDomainMessages("products");
  const storesMsg = productsMsg.stores;
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("connection_id")?.trim() ?? "";
  const [connections, setConnections] = useState<StoreConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [listSheetOpen, setListSheetOpen] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [newMerchants, setNewMerchants] = useState<YampiMerchantOption[]>([]);
  const [newUserToken, setNewUserToken] = useState("");
  const [newUserSecretKey, setNewUserSecretKey] = useState("");
  const [creating, setCreating] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  const [draft, setDraft] = useState<StoreConnection | null>(null);
  const [fieldPolicies, setFieldPolicies] = useState<
    Partial<Record<ProductFieldKey, FieldSource>>
  >({});
  const [importNewOnSync, setImportNewOnSync] = useState(true);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchStoreConnections();
      setConnections(items);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, locale) || storesMsg.toasts.loadFailed,
      );
    } finally {
      setLoading(false);
    }
  }, [locale, storesMsg.toasts.loadFailed]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  const filteredConnections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return connections;
    return connections.filter(
      (connection) =>
        connection.label.toLowerCase().includes(query) ||
        connection.provider_type.toLowerCase().includes(query),
    );
  }, [connections, searchQuery]);

  const selectConnection = useCallback(
    (connectionId: string) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set("connection_id", connectionId);
        return next;
      });
      setListSheetOpen(false);
    },
    [setSearchParams],
  );

  const clearStage = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("connection_id");
      return next;
    });
  }, [setSearchParams]);

  useEffect(() => {
    if (selectedId === NEW_STORE_ID) {
      setDraft(null);
      setFieldPolicies({});
      setNewMerchants([]);
      return;
    }

    const connection = connections.find((item) => item.id === selectedId) ?? null;
    setDraft(connection ? { ...connection } : null);

    if (!connection) {
      setFieldPolicies({});
      return;
    }

    void fetchStoreFieldPolicies(connection.id)
      .then((policies) => setFieldPolicies(policiesToMap(policies)))
      .catch(() => setFieldPolicies({}));
  }, [connections, selectedId]);

  async function handleDiscover() {
    if (!newUserToken.trim() || !newUserSecretKey.trim()) {
      toast.error(storesMsg.toasts.credentialsRequired);
      return;
    }

    setDiscovering(true);
    try {
      const result = await discoverYampiMerchants({
        user_token: newUserToken.trim(),
        user_secret_key: newUserSecretKey.trim(),
        alias: newAlias.trim() || undefined,
      });
      setNewMerchants(result.merchants);
      if (result.resolved_alias) {
        setNewAlias(result.resolved_alias);
      } else if (result.merchants.length === 1) {
        setNewAlias(result.merchants[0]!.alias);
      } else if (!newAlias.trim()) {
        setNewAlias("");
      }
      toast.success(
        result.merchants.length === 0
          ? storesMsg.toasts.noneFound
          : storesMsg.toasts.merchantsFound.replace(
              "{count}",
              String(result.merchants.length),
            ),
      );
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, locale) || storesMsg.toasts.searchFailed,
      );
    } finally {
      setDiscovering(false);
    }
  }

  async function handleCreate() {
    if (!newLabel.trim() || !newUserToken.trim() || !newUserSecretKey.trim()) {
      toast.error(storesMsg.toasts.formIncomplete);
      return;
    }

    if (newMerchants.length > 1 && !newAlias.trim()) {
      toast.error(storesMsg.toasts.aliasRequired);
      return;
    }

    setCreating(true);
    try {
      const created = await createStoreConnection({
        provider_type: "yampi",
        label: newLabel.trim(),
        alias: newAlias.trim() || undefined,
        user_token: newUserToken.trim(),
        user_secret_key: newUserSecretKey.trim(),
      });
      setConnections((current) => [...current, created]);
      setNewLabel("");
      setNewAlias("");
      setNewMerchants([]);
      setNewUserToken("");
      setNewUserSecretKey("");
      selectConnection(created.id);
      toast.success(
        created.yampi_alias
          ? storesMsg.toasts.connectedWithAlias.replace(
              "{alias}",
              created.yampi_alias,
            )
          : storesMsg.toasts.connected,
      );
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, locale) || storesMsg.toasts.connectFailed,
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleSave() {
    if (!draft) return;
    setBusy(true);
    try {
      const updated = await updateStoreConnection(draft.id, { label: draft.label });
      const policiesPayload = Object.fromEntries(
        Object.entries(fieldPolicies).map(([fieldKey, source]) => [
          fieldKey,
          { source },
        ]),
      );
      await updateStoreFieldPolicies(draft.id, policiesPayload);
      setConnections((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setDraft({ ...updated });
      toast.success(storesMsg.toasts.saved);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || storesMsg.toasts.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    if (!draft) return;
    setBusy(true);
    try {
      const result = await testStoreConnection(draft.id);
      if (result.ok) {
        toast.success(result.message || storesMsg.toasts.testOk);
      } else {
        toast.error(result.message || storesMsg.toasts.testFailed);
      }
      const items = await fetchStoreConnections();
      setConnections(items);
      const refreshed = items.find((item) => item.id === draft.id);
      if (refreshed) setDraft({ ...refreshed });
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || storesMsg.toasts.testError);
      const items = await fetchStoreConnections();
      setConnections(items);
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    if (!draft) return;
    setBusy(true);
    try {
      const result = await syncStoreConnection(draft.id, importNewOnSync);
      const errorsSuffix = result.errors.length
        ? storesMsg.toasts.syncErrorsSuffix.replace(
            "{count}",
            String(result.errors.length),
          )
        : "";
      toast.success(
        storesMsg.toasts.syncResult
          .replace("{imported}", String(result.imported))
          .replace("{updated}", String(result.updated))
          .replace("{skipped}", String(result.skipped))
          .replace("{errors}", errorsSuffix),
      );
      const items = await fetchStoreConnections();
      setConnections(items);
      const refreshed = items.find((item) => item.id === draft.id);
      if (refreshed) setDraft({ ...refreshed });
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || storesMsg.toasts.syncFailed);
      const items = await fetchStoreConnections();
      setConnections(items);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!draft) return;
    const ok = await confirm({
      title: storesMsg.confirm.remove.title,
      description: storesMsg.confirm.remove.description.replace(
        "{label}",
        draft.label,
      ),
      confirmLabel: storesMsg.confirm.remove.confirmLabel,
      variant: "destructive",
    });
    if (!ok) return;

    setBusy(true);
    try {
      await deleteStoreConnection(draft.id);
      setConnections((current) => current.filter((item) => item.id !== draft.id));
      clearStage();
      toast.success(storesMsg.toasts.removed);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, locale) || storesMsg.toasts.removeFailed,
      );
    } finally {
      setBusy(false);
    }
  }

  const inStage = Boolean(selectedId);

  const pageHeader = (
    <PageContainer.Header
      title={storesMsg.page.title}
      description={storesMsg.page.description}
    />
  );

  const listControls = (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="w-full gap-1.5"
          onClick={() => selectConnection(NEW_STORE_ID)}
        >
          <Plus className="size-4" />
          {storesMsg.page.newConnection}
        </Button>
      </div>
      <div className="relative w-full min-w-0">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={storesMsg.page.searchPlaceholder}
          className="h-9 pl-10 text-sm focus-visible:ring-primary/40"
        />
      </div>
    </div>
  );

  const listBody = loading ? (
    <OpsEmptyState>{storesMsg.page.loading}</OpsEmptyState>
  ) : (
    <>
      <StoreInboxNewItem
        selected={selectedId === NEW_STORE_ID}
        onSelect={() => selectConnection(NEW_STORE_ID)}
      />
      {filteredConnections.length === 0 ? (
        <OpsEmptyState title={storesMsg.empty.title}>
          {connections.length === 0
            ? storesMsg.empty.noStores
            : storesMsg.empty.noResults}
        </OpsEmptyState>
      ) : (
        <StoreInboxList
          connections={filteredConnections}
          selectedId={selectedId}
          onSelect={selectConnection}
        />
      )}
    </>
  );

  const detailBody =
    selectedId === NEW_STORE_ID ? (
      <StoreCreatePanel
        label={newLabel}
        alias={newAlias}
        merchants={newMerchants}
        userToken={newUserToken}
        userSecretKey={newUserSecretKey}
        creating={creating}
        discovering={discovering}
        onLabelChange={setNewLabel}
        onAliasChange={setNewAlias}
        onUserTokenChange={setNewUserToken}
        onUserSecretKeyChange={setNewUserSecretKey}
        onDiscover={() => void handleDiscover()}
        onSubmit={() => void handleCreate()}
      />
    ) : draft ? (
      <StoreDetailPanel
        connection={draft}
        fieldPolicies={fieldPolicies}
        importNewOnSync={importNewOnSync}
        busy={busy}
        onLabelChange={(label) => setDraft((current) => (current ? { ...current, label } : current))}
        onFieldPolicyChange={(fieldKey, source) =>
          setFieldPolicies((current) => ({ ...current, [fieldKey]: source }))
        }
        onImportNewChange={setImportNewOnSync}
        onSave={() => void handleSave()}
        onTest={() => void handleTest()}
        onSync={() => void handleSync()}
        onDelete={() => void handleDelete()}
      />
    ) : selectedId ? (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        {storesMsg.page.loadingConnection}
      </div>
    ) : (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <OpsEmptyState title={storesMsg.page.selectTitle}>
          {storesMsg.page.selectBody}
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
                      {storesMsg.page.back}
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
        <AppSheet.Header title={storesMsg.page.sheetTitle} />
        <div className="shrink-0 border-b p-3">{listControls}</div>
        <AppSheet.Body scroll={false}>
          <PageScrollArea className="min-h-0 flex-1">{listBody}</PageScrollArea>
        </AppSheet.Body>
      </AppSheet>
    </PageContainer>
  );
}
