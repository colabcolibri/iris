import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, PanelLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { downloadWebhookEventsExport, fetchWebhookEvents } from "@/lib/api";
import type { WebhookEvent, WebhookProcessingStatus } from "@/lib/types";
import { commentsThreadHref } from "@/lib/comments-href";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<WebhookEvent["processing_status"], string> = {
  received: "recebido",
  processed: "processado",
  ignored: "ignorado",
  failed: "falhou",
};

const STATUS_FILTER_OPTIONS: Array<WebhookProcessingStatus | "all"> = [
  "all",
  "received",
  "processed",
  "ignored",
  "failed",
];

function statusClass(status: WebhookEvent["processing_status"]): string {
  switch (status) {
    case "processed":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
    case "ignored":
      return "bg-muted text-muted-foreground";
    case "failed":
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
  }
}

function truncateId(id: string | null): string {
  if (!id) {
    return "—";
  }
  return `${id.slice(0, 8)}…`;
}

function verbLabel(verb: string | null): string | null {
  if (!verb) {
    return null;
  }
  switch (verb.toLowerCase()) {
    case "add":
      return "novo";
    case "edited":
    case "edit":
      return "editado";
    case "remove":
    case "delete":
      return "removido";
    default:
      return verb;
  }
}

function StatusBadges({ event }: { event: WebhookEvent }) {
  const verb = verbLabel(event.verb);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          "rounded px-2 py-0.5 text-xs font-semibold uppercase",
          statusClass(event.processing_status),
        )}
      >
        {STATUS_LABELS[event.processing_status]}
      </span>
      {verb ? (
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {verb}
        </span>
      ) : null}
      {!event.signature_valid ? (
        <span className="rounded bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
          assinatura inválida
        </span>
      ) : null}
    </div>
  );
}

function PostLink({ event }: { event: WebhookEvent }) {
  const href = commentsThreadHref(event.post_id);
  if (href) {
    return (
      <Link to={href} className="text-primary hover:underline">
        {truncateId(event.post_id!)}
      </Link>
    );
  }
  if (event.ig_media_id) {
    return (
      <span className="font-mono text-sm text-muted-foreground">
        mídia {truncateId(event.ig_media_id)}
      </span>
    );
  }
  return <span className="text-muted-foreground">—</span>;
}

function CommentLink({ event }: { event: WebhookEvent }) {
  const href = commentsThreadHref(event.post_id, event.comment_id);
  if (href && event.comment_id) {
    return (
      <Link to={href} className="text-primary hover:underline">
        {truncateId(event.comment_id)}
      </Link>
    );
  }
  if (event.ig_comment_id) {
    return (
      <span className="font-mono text-sm text-muted-foreground">
        ig {truncateId(event.ig_comment_id)}
      </span>
    );
  }
  return <span className="text-muted-foreground">—</span>;
}

const EXPORT_LIMIT_OPTIONS = [100, 500, 1000, 5000] as const;

function EventListRow({
  event,
  selected,
  onSelect,
}: {
  event: WebhookEvent;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-1.5 border-b border-border/60 px-4 py-4 text-left transition-colors hover:bg-muted/30",
        selected && "bg-muted/40",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadges event={event} />
        <span className="text-sm text-muted-foreground">
          {new Date(event.received_at).toLocaleString("pt-BR")}
        </span>
      </div>
      <p className="text-base font-semibold leading-snug text-foreground">
        {event.webhook_type}
      </p>
      <p className="line-clamp-2 text-sm text-muted-foreground">
        {event.author_username ? `@${event.author_username}` : "autor —"}
        {event.text_preview ? ` · “${event.text_preview}”` : ""}
      </p>
    </button>
  );
}

function EventListChrome({
  statusFilter,
  setStatusFilter,
  fieldFilter,
  setFieldFilter,
  invalidOnly,
  setInvalidOnly,
  exportLimit,
  setExportLimit,
  exporting,
  loading,
  onExport,
  onReload,
}: {
  statusFilter: WebhookProcessingStatus | "all";
  setStatusFilter: (v: WebhookProcessingStatus | "all") => void;
  fieldFilter: "all" | "comments";
  setFieldFilter: (v: "all" | "comments") => void;
  invalidOnly: boolean;
  setInvalidOnly: (v: boolean) => void;
  exportLimit: number;
  setExportLimit: (v: number) => void;
  exporting: boolean;
  loading: boolean;
  onExport: () => void;
  onReload: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label
          className="text-sm text-muted-foreground"
          htmlFor="webhook-status-filter"
        >
          Status
        </label>
        <select
          id="webhook-status-filter"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as WebhookProcessingStatus | "all",
            )
          }
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "todos" : STATUS_LABELS[option]}
            </option>
          ))}
        </select>
        <label
          className="text-sm text-muted-foreground"
          htmlFor="webhook-field-filter"
        >
          Tipo
        </label>
        <select
          id="webhook-field-filter"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={fieldFilter}
          onChange={(event) =>
            setFieldFilter(event.target.value as "all" | "comments")
          }
        >
          <option value="all">todos</option>
          <option value="comments">comentários</option>
        </select>
        <label className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={invalidOnly}
            onChange={(event) => setInvalidOnly(event.target.checked)}
          />
          só assinatura inválida
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
          htmlFor="webhook-export-limit"
        >
          Exportar últimos
        </label>
        <select
          id="webhook-export-limit"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={exportLimit}
          onChange={(event) => setExportLimit(Number(event.target.value))}
          disabled={exporting}
        >
          {EXPORT_LIMIT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={exporting}
        >
          <Download
            className={`mr-1.5 h-3.5 w-3.5 ${exporting ? "animate-pulse" : ""}`}
          />
          Exportar JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReload}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>
    </div>
  );
}

export function WebhookEventsPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("event_id")?.trim() ?? "";
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportLimit, setExportLimit] = useState<number>(500);
  const [statusFilter, setStatusFilter] = useState<
    WebhookProcessingStatus | "all"
  >("all");
  const [fieldFilter, setFieldFilter] = useState<"all" | "comments">("all");
  const [invalidOnly, setInvalidOnly] = useState(false);
  const [listSheetOpen, setListSheetOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWebhookEvents(100, {
        status: statusFilter === "all" ? undefined : statusFilter,
        field: fieldFilter === "all" ? undefined : fieldFilter,
        signatureValid: invalidOnly ? false : undefined,
      });
      setEvents(data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao carregar webhooks.",
      );
    } finally {
      setLoading(false);
    }
  }, [fieldFilter, invalidOnly, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId],
  );
  const inStage = Boolean(selectedId);

  function selectEvent(id: string) {
    setSearchParams({ event_id: id });
    setListSheetOpen(false);
  }

  function clearStage() {
    setSearchParams({});
    setListSheetOpen(false);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await downloadWebhookEventsExport(exportLimit, {
        status: statusFilter === "all" ? undefined : statusFilter,
        field: fieldFilter === "all" ? undefined : fieldFilter,
        signatureValid: invalidOnly ? false : undefined,
      });
      toast.success(`Exportados os últimos ${exportLimit} webhooks.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao exportar webhooks.",
      );
    } finally {
      setExporting(false);
    }
  }

  const listChrome = (
    <EventListChrome
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      fieldFilter={fieldFilter}
      setFieldFilter={setFieldFilter}
      invalidOnly={invalidOnly}
      setInvalidOnly={setInvalidOnly}
      exportLimit={exportLimit}
      setExportLimit={setExportLimit}
      exporting={exporting}
      loading={loading}
      onExport={() => void handleExport()}
      onReload={() => void load()}
    />
  );

  const listBody =
    loading && events.length === 0 ? (
      <p className="px-4 py-6 text-base text-muted-foreground">Carregando…</p>
    ) : events.length === 0 ? (
      <p className="px-4 py-6 text-base text-muted-foreground">
        Nenhum webhook encontrado com os filtros atuais.
      </p>
    ) : (
      events.map((event) => (
        <EventListRow
          key={event.id}
          event={event}
          selected={event.id === selectedId}
          onSelect={() => selectEvent(event.id)}
        />
      ))
    );

  if (!inStage) {
    return (
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-hidden">
        <div className="shrink-0 space-y-3 border-b border-border p-4 sm:px-6">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Eventos
          </h2>
          {listChrome}
        </div>
        <PageScrollArea>{listBody}</PageScrollArea>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 sm:px-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-11 gap-2"
          onClick={clearStage}
        >
          <ArrowLeft className="size-4" />
          Todos os eventos
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
          {selectedEvent
            ? `${selectedEvent.webhook_type}${selectedEvent.author_username ? ` · @${selectedEvent.author_username}` : ""}`
            : selectedId}
        </p>
      </div>

      <PageScrollArea contentClassName="p-4 sm:p-6">
        {!selectedEvent ? (
          <p className="mx-auto max-w-3xl text-base text-muted-foreground">
            {loading
              ? "Carregando evento…"
              : "Evento não encontrado na lista atual (filtros podem estar ocultando)."}
          </p>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadges event={selectedEvent} />
              <span className="text-sm text-muted-foreground">
                {new Date(selectedEvent.received_at).toLocaleString("pt-BR")}
              </span>
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                {selectedEvent.webhook_type}
              </h2>
              {selectedEvent.field ? (
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {selectedEvent.field}
                </p>
              ) : null}
            </div>

            {selectedEvent.text_preview ? (
              <p className="text-base leading-relaxed text-foreground">
                “{selectedEvent.text_preview}”
              </p>
            ) : null}
            {selectedEvent.error_message ? (
              <p className="text-base text-destructive">
                {selectedEvent.error_message}
              </p>
            ) : null}

            <div className="grid gap-4 rounded-[var(--iris-radius-lg)] border border-border/70 bg-muted/15 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Post
                </p>
                <div className="mt-1 text-base">
                  <PostLink event={selectedEvent} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Comentário
                </p>
                <div className="mt-1 text-base">
                  <CommentLink event={selectedEvent} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Autor
                </p>
                <p className="mt-1 text-base text-foreground">
                  {selectedEvent.author_username
                    ? `@${selectedEvent.author_username}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Entradas
                </p>
                <p className="mt-1 text-base text-foreground">
                  {selectedEvent.entries_count}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Payload
              </h3>
              <PageScrollArea
                className="mt-2 h-[min(70vh,40rem)] max-h-[min(70vh,40rem)] flex-none rounded-[var(--iris-radius-lg)] border border-border/70"
                contentClassName="bg-muted/30 p-4 font-mono text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-muted-foreground"
              >
                {selectedEvent.payload_json}
                {selectedEvent.payload_truncated
                  ? "\n… (truncado na listagem — use exportar para o JSON completo)"
                  : ""}
              </PageScrollArea>
            </div>
          </div>
        )}
      </PageScrollArea>

      <Sheet open={listSheetOpen} onOpenChange={setListSheetOpen}>
        <SheetContent
          side="left"
          className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-border">
            <SheetTitle className="font-display text-lg font-semibold">
              Eventos
            </SheetTitle>
          </SheetHeader>
          <div className="shrink-0 space-y-3 border-b border-border p-4">
            {listChrome}
          </div>
          <PageScrollArea>{listBody}</PageScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
