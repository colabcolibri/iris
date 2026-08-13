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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useConfirmDialog } from "@/contexts/confirm-dialog-context";
import {
  createStoreConnection,
  deleteStoreConnection,
  fetchStoreConnections,
  fetchStoreFieldPolicies,
  syncStoreConnection,
  testStoreConnection,
  updateStoreConnection,
  updateStoreFieldPolicies,
} from "@/lib/api";
import type { FieldSource, ProductFieldKey, StoreConnection } from "@/lib/types";
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
  const confirm = useConfirmDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("connection_id")?.trim() ?? "";
  const [connections, setConnections] = useState<StoreConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [listSheetOpen, setListSheetOpen] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [newUserToken, setNewUserToken] = useState("");
  const [newUserSecretKey, setNewUserSecretKey] = useState("");
  const [creating, setCreating] = useState(false);

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
        err instanceof Error ? err.message : "Falha ao carregar lojas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

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

  async function handleCreate() {
    if (!newLabel.trim() || !newAlias.trim() || !newUserToken.trim() || !newUserSecretKey.trim()) {
      toast.error("Preencha nome, alias e credenciais Yampi.");
      return;
    }

    setCreating(true);
    try {
      const created = await createStoreConnection({
        provider_type: "yampi",
        label: newLabel.trim(),
        alias: newAlias.trim(),
        user_token: newUserToken.trim(),
        user_secret_key: newUserSecretKey.trim(),
      });
      setConnections((current) => [...current, created]);
      setNewLabel("");
      setNewAlias("");
      setNewUserToken("");
      setNewUserSecretKey("");
      selectConnection(created.id);
      toast.success("Loja conectada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao conectar loja.");
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
      toast.success("Conexão salva.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
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
        toast.success(result.message || "Conexão OK.");
      } else {
        toast.error(result.message || "Falha no teste.");
      }
      const items = await fetchStoreConnections();
      setConnections(items);
      const refreshed = items.find((item) => item.id === draft.id);
      if (refreshed) setDraft({ ...refreshed });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao testar.");
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
      toast.success(
        `Sync: ${result.imported} importados, ${result.updated} atualizados, ${result.skipped} ignorados${
          result.errors.length ? `, ${result.errors.length} erros` : ""
        }.`,
      );
      const items = await fetchStoreConnections();
      setConnections(items);
      const refreshed = items.find((item) => item.id === draft.id);
      if (refreshed) setDraft({ ...refreshed });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao sincronizar.");
      const items = await fetchStoreConnections();
      setConnections(items);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!draft) return;
    const ok = await confirm({
      title: "Remover conexão?",
      description: `A loja "${draft.label}" será desconectada. Vínculos de produtos também serão removidos.`,
      confirmLabel: "Remover",
      variant: "destructive",
    });
    if (!ok) return;

    setBusy(true);
    try {
      await deleteStoreConnection(draft.id);
      setConnections((current) => current.filter((item) => item.id !== draft.id));
      clearStage();
      toast.success("Conexão removida.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao remover.");
    } finally {
      setBusy(false);
    }
  }

  const inStage = Boolean(selectedId);

  const pageHeader = (
    <PageContainer.Header
      eyebrow="Catálogo"
      title="Lojas conectadas"
      description="Conecte sua loja Yampi, sincronize o catálogo e defina políticas globais de campo."
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
          Nova conexão
        </Button>
      </div>
      <div className="relative w-full min-w-0">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Buscar por nome…"
          className="h-9 pl-10 text-sm focus-visible:ring-primary/40"
        />
      </div>
    </div>
  );

  const listBody = loading ? (
    <OpsEmptyState>Carregando lojas…</OpsEmptyState>
  ) : (
    <>
      <StoreInboxNewItem
        selected={selectedId === NEW_STORE_ID}
        onSelect={() => selectConnection(NEW_STORE_ID)}
      />
      {filteredConnections.length === 0 ? (
        <OpsEmptyState title="Nenhuma loja">
          {connections.length === 0
            ? "Conecte sua primeira loja Yampi para importar o catálogo."
            : "Nenhuma loja corresponde à busca."}
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
        userToken={newUserToken}
        userSecretKey={newUserSecretKey}
        creating={creating}
        onLabelChange={setNewLabel}
        onAliasChange={setNewAlias}
        onUserTokenChange={setNewUserToken}
        onUserSecretKeyChange={setNewUserSecretKey}
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
        Carregando conexão…
      </div>
    ) : (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <OpsEmptyState title="Selecione uma loja">
          Escolha uma conexão na lista ou crie uma nova loja Yampi.
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
                      Voltar
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

      <Sheet open={listSheetOpen} onOpenChange={setListSheetOpen}>
        <SheetContent
          side="left"
          className="flex w-full max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-border">
            <SheetTitle className="font-display text-lg font-semibold">
              Lojas
            </SheetTitle>
          </SheetHeader>
          <div className="shrink-0 border-b p-3">{listControls}</div>
          <PageScrollArea className="min-h-0 flex-1">{listBody}</PageScrollArea>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
