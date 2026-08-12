import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, PanelLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ReplyAuditTimeline } from "@/components/comments/reply-audit-timeline";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageContainer } from "@/components/templates/page-container";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import {
  OpsEmptyState,
  opsFilterSelectClassName,
} from "@/components/templates/ops-empty-state";
import {
  fetchAgentRunDetail,
  fetchAgentRuns,
  fetchReplyPersona,
} from "@/lib/api";
import { commentsThreadHref } from "@/lib/comments-href";
import type { AgentRunDetail, AgentRunListItem } from "@/lib/types";
import { RESPONSE_LANGUAGE_OPTIONS } from "@iris/domain/reply-language/response-languages";
import { cn } from "@/lib/utils";

const TERMINAL_LABELS: Record<string, string> = {
  approved: "aprovado",
  approved_simple: "aprovado (simples)",
  skipped_triage: "ignorado na triagem",
  blocked_harmful: "bloqueado (harmful)",
  rejected_verify: "rejeitado na verificação",
};

function terminalBadgeClass(status: string | null): string {
  switch (status) {
    case "approved":
    case "approved_simple":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
    case "blocked_harmful":
    case "rejected_verify":
      return "bg-destructive/15 text-destructive";
    case "skipped_triage":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
  }
}

function formatDuration(ms: number | null): string {
  if (ms == null) {
    return "—";
  }
  if (ms < 1000) {
    return `${ms} ms`;
  }
  return `${(ms / 1000).toFixed(1)} s`;
}

export function AgentRunsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("run_id")?.trim() ?? "";
  const [items, setItems] = useState<AgentRunListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminalFilter, setTerminalFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [detail, setDetail] = useState<AgentRunDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [responseLanguage, setResponseLanguage] = useState<string | null>(null);
  const [listSheetOpen, setListSheetOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAgentRuns({
        limit: 50,
        terminal_status: terminalFilter || undefined,
        reply_tier: tierFilter || undefined,
      });
      setItems(data.items);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao carregar execuções.",
      );
    } finally {
      setLoading(false);
    }
  }, [terminalFilter, tierFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetchReplyPersona()
      .then((persona) => setResponseLanguage(persona.response_language))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    setDetailLoading(true);
    void fetchAgentRunDetail(selectedId)
      .then(setDetail)
      .catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Falha ao carregar detalhe.",
        );
        setDetail(null);
      })
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const selectedListItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const threadHref = useMemo(
    () =>
      commentsThreadHref(
        detail?.post_id ?? selectedListItem?.post_id,
        detail?.comment_id ?? selectedListItem?.comment_id,
      ),
    [
      detail?.post_id,
      detail?.comment_id,
      selectedListItem?.post_id,
      selectedListItem?.comment_id,
    ],
  );

  const languageLabel =
    RESPONSE_LANGUAGE_OPTIONS.find((option) => option.code === responseLanguage)
      ?.label ?? responseLanguage;

  const inStage = Boolean(selectedId);

  function selectRun(id: string) {
    setSearchParams({ run_id: id });
    setListSheetOpen(false);
  }

  function clearStage() {
    setSearchParams({});
    setListSheetOpen(false);
  }

  const listFilters = (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className={opsFilterSelectClassName}
        value={terminalFilter}
        onChange={(event) => setTerminalFilter(event.target.value)}
      >
        <option value="">todos os status</option>
        {Object.entries(TERMINAL_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select
        className={opsFilterSelectClassName}
        value={tierFilter}
        onChange={(event) => setTierFilter(event.target.value)}
      >
        <option value="">todos os tiers</option>
        <option value="none">none</option>
        <option value="simple">simple</option>
        <option value="full">full</option>
      </select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void load()}
        disabled={loading}
      >
        <RefreshCw
          className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
        />
        Atualizar
      </Button>
    </div>
  );

  const listBody =
    loading && items.length === 0 ? (
      <OpsEmptyState>Carregando execuções…</OpsEmptyState>
    ) : items.length === 0 ? (
      <OpsEmptyState title="Nenhuma execução">
        Nenhuma run encontrada com os filtros atuais.
      </OpsEmptyState>
    ) : (
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="sm:px-6">Quando</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Trigger</TableHead>
            <TableHead className="hidden md:table-cell">Tier</TableHead>
            <TableHead className="hidden lg:table-cell">Modelo</TableHead>
            <TableHead className="hidden sm:table-cell">Duração</TableHead>
            <TableHead className="hidden lg:table-cell">Tokens</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow
              key={row.id}
              data-state={selectedId === row.id ? "selected" : undefined}
              className="cursor-pointer"
              onClick={() => selectRun(row.id)}
            >
              <TableCell className="whitespace-nowrap text-muted-foreground sm:px-6">
                {new Date(row.created_at).toLocaleString("pt-BR")}
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "rounded-sm px-2 py-0.5 text-xs font-semibold uppercase",
                    terminalBadgeClass(row.terminal_status),
                  )}
                >
                  {TERMINAL_LABELS[row.terminal_status ?? ""] ??
                    row.terminal_status ??
                    "—"}
                </span>
              </TableCell>
              <TableCell>
                <p className="font-semibold text-foreground">{row.trigger}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {row.step_count === 1
                    ? "1 chamada"
                    : `${row.step_count} chamadas`}
                </p>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {row.reply_tier ?? "—"}
              </TableCell>
              <TableCell className="hidden max-w-56 truncate font-mono text-sm font-semibold text-primary lg:table-cell">
                {(row.models ?? []).length > 0
                  ? (row.models ?? []).join(", ")
                  : "—"}
              </TableCell>
              <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                {formatDuration(row.duration_ms)}
              </TableCell>
              <TableCell className="hidden tabular-nums text-muted-foreground lg:table-cell">
                {row.total_tokens != null ? row.total_tokens : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );

  return (
    <PageContainer variant="fill">
      <PageContainer.Content width="full">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {!inStage ? (
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
              <div className="shrink-0 space-y-3 px-4 py-4 sm:px-6 md:px-8">
                <PageContainer.Header
                  eyebrow="Operação"
                  title="Execuções do agente"
                  description="Monitoramento global das runs de auto-resposta — cada execução e suas chamadas."
                />
                {responseLanguage ? (
                  <p className="text-xs text-muted-foreground">
                    Idioma na persona:{" "}
                    <span className="font-semibold text-foreground">
                      {languageLabel}
                    </span>
                  </p>
                ) : null}
                {listFilters}
              </div>
              <PageScrollArea>{listBody}</PageScrollArea>
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2 sm:px-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-11 gap-2"
                  onClick={clearStage}
                >
                  <ArrowLeft className="size-4" />
                  Todas as execuções
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11 gap-2"
                  onClick={() => setListSheetOpen(true)}
                >
                  <PanelLeft className="size-4" />
                  Lista
                </Button>
                <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                  {selectedListItem?.trigger ??
                    detail?.run.trigger ??
                    selectedId}
                </p>
              </div>

              <PageScrollArea contentClassName="p-4 sm:p-6 md:px-8">
                <div className="w-full">
                  {detailLoading ? (
                    <OpsEmptyState>Carregando detalhe…</OpsEmptyState>
                  ) : detail?.audit ? (
                    <ReplyAuditTimeline
                      audit={detail.audit}
                      summary={{
                        durationMs: selectedListItem?.duration_ms ?? null,
                        totalPromptTokens:
                          selectedListItem?.total_prompt_tokens ?? null,
                        totalCompletionTokens:
                          selectedListItem?.total_completion_tokens ?? null,
                        totalTokens: selectedListItem?.total_tokens ?? null,
                        commentHref: threadHref,
                      }}
                    />
                  ) : (
                    <OpsEmptyState title="Sem auditoria">
                      Sem dados de auditoria para esta execução.
                    </OpsEmptyState>
                  )}
                  {threadHref ? (
                    <p className="mt-4 text-base">
                      <Link
                        to={threadHref}
                        className="font-semibold text-primary hover:underline"
                      >
                        abrir thread do comentário
                      </Link>
                    </p>
                  ) : null}
                </div>
              </PageScrollArea>

              <Sheet open={listSheetOpen} onOpenChange={setListSheetOpen}>
                <SheetContent
                  side="left"
                  className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-md"
                >
                  <SheetHeader className="border-b border-border">
                    <SheetTitle className="font-display text-lg font-semibold">
                      Execuções
                    </SheetTitle>
                  </SheetHeader>
                  <div className="shrink-0 space-y-3 border-b border-border p-4">
                    {listFilters}
                  </div>
                  <PageScrollArea>{listBody}</PageScrollArea>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </PageContainer.Content>
    </PageContainer>
  );
}
