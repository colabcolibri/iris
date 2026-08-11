import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadWebhookEventsExport, fetchWebhookEvents } from "@/lib/api";
import type { WebhookEvent, WebhookProcessingStatus } from "@/lib/types";
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
          "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
          statusClass(event.processing_status),
        )}
      >
        {STATUS_LABELS[event.processing_status]}
      </span>
      {verb ? (
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          {verb}
        </span>
      ) : null}
      {!event.signature_valid ? (
        <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
          assinatura inválida
        </span>
      ) : null}
    </div>
  );
}

function PostLink({ event }: { event: WebhookEvent }) {
  if (event.post_id) {
    return (
      <Link to={`/comments?post_id=${event.post_id}`} className="text-primary hover:underline">
        {truncateId(event.post_id)}
      </Link>
    );
  }

  if (event.ig_media_id) {
    return (
      <span className="font-mono text-[11px] text-muted-foreground">
        mídia {truncateId(event.ig_media_id)}
      </span>
    );
  }

  return <span className="text-muted-foreground">—</span>;
}

function CommentLink({ event }: { event: WebhookEvent }) {
  if (event.comment_id) {
    return (
      <Link
        to={`/comments?post_id=${event.post_id ?? ""}&comment=${event.comment_id}`}
        className="text-primary hover:underline"
      >
        {truncateId(event.comment_id)}
      </Link>
    );
  }

  if (event.ig_comment_id) {
    return (
      <span className="font-mono text-[11px] text-muted-foreground">
        ig {truncateId(event.ig_comment_id)}
      </span>
    );
  }

  return <span className="text-muted-foreground">—</span>;
}

function EntityLinks({ event }: { event: WebhookEvent }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Post</p>
        <PostLink event={event} />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Comentário
        </p>
        <CommentLink event={event} />
      </div>
    </div>
  );
}

type WebhookEventDetailsProps = {
  event: WebhookEvent;
  open: boolean;
  onToggle: () => void;
};

function WebhookEventDetails({ event, open, onToggle }: WebhookEventDetailsProps) {
  return (
    <div className="space-y-1">
      {event.text_preview ? (
        <p className="text-sm text-foreground/90">“{event.text_preview}”</p>
      ) : null}
      {event.error_message ? <p className="text-destructive">{event.error_message}</p> : null}
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary"
        onClick={onToggle}
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        {open ? "Ocultar payload" : "Ver payload completo"}
      </button>
      {open ? (
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/40 p-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
          {event.payload_json}
          {event.payload_truncated ? "\n… (truncado na listagem — use exportar para o JSON completo)" : ""}
        </pre>
      ) : null}
    </div>
  );
}

function WebhookEventMobileCard({ event }: { event: WebhookEvent }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border/70 bg-background/60 p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadges event={event} />
        <span className="text-muted-foreground">
          {new Date(event.received_at).toLocaleString("pt-BR")}
        </span>
      </div>
      <p className="mt-2 font-medium text-foreground">{event.webhook_type}</p>
      <p className="mt-1 text-muted-foreground">
        {event.author_username ? `@${event.author_username}` : "autor —"}
        {event.entries_count > 1 ? ` · ${event.entries_count} entradas` : ""}
      </p>
      <div className="mt-1">
        <EntityLinks event={event} />
      </div>
      <div className="mt-2">
        <WebhookEventDetails event={event} open={open} onToggle={() => setOpen((v) => !v)} />
      </div>
    </div>
  );
}

const EXPORT_LIMIT_OPTIONS = [100, 500, 1000, 5000] as const;

export function WebhookEventsPanel() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportLimit, setExportLimit] = useState<number>(500);
  const [statusFilter, setStatusFilter] = useState<WebhookProcessingStatus | "all">("all");
  const [fieldFilter, setFieldFilter] = useState<"all" | "comments">("all");
  const [invalidOnly, setInvalidOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      toast.error(err instanceof Error ? err.message : "Falha ao carregar webhooks.");
    } finally {
      setLoading(false);
    }
  }, [fieldFilter, invalidOnly, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => events, [events]);

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
      toast.error(err instanceof Error ? err.message : "Falha ao exportar webhooks.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-muted-foreground" htmlFor="webhook-status-filter">
            Status
          </label>
          <select
            id="webhook-status-filter"
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as WebhookProcessingStatus | "all")
            }
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "todos" : STATUS_LABELS[option]}
              </option>
            ))}
          </select>
          <label className="text-xs text-muted-foreground" htmlFor="webhook-field-filter">
            Tipo
          </label>
          <select
            id="webhook-field-filter"
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={fieldFilter}
            onChange={(event) => setFieldFilter(event.target.value as "all" | "comments")}
          >
            <option value="all">todos</option>
            <option value="comments">comentários</option>
          </select>
          <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={invalidOnly}
              onChange={(event) => setInvalidOnly(event.target.checked)}
            />
            só assinatura inválida
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" htmlFor="webhook-export-limit">
            Exportar últimos
          </label>
          <select
            id="webhook-export-limit"
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
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
            onClick={() => void handleExport()}
            disabled={exporting}
          >
            <Download className={`mr-1.5 h-3.5 w-3.5 ${exporting ? "animate-pulse" : ""}`} />
            Exportar JSON
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        {loading && events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum webhook encontrado com os filtros atuais.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[960px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/70 text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Recebido</th>
                    <th className="px-2 py-2 font-medium">Tipo</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Autor / resumo</th>
                    <th className="px-2 py-2 font-medium">Post</th>
                    <th className="px-2 py-2 font-medium">Comentário</th>
                    <th className="px-2 py-2 font-medium">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => (
                    <tr key={event.id} className="border-b border-border/50 align-top">
                      <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(event.received_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-2 py-3">
                        <p className="font-medium text-foreground">{event.webhook_type}</p>
                        {event.field ? (
                          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{event.field}</p>
                        ) : null}
                      </td>
                      <td className="px-2 py-3">
                        <StatusBadges event={event} />
                      </td>
                      <td className="px-2 py-3">
                        <p className="font-medium text-foreground">
                          {event.author_username ? `@${event.author_username}` : "—"}
                        </p>
                        {event.text_preview ? (
                          <p className="mt-1 max-w-xs text-muted-foreground">“{event.text_preview}”</p>
                        ) : null}
                        {event.entries_count > 1 ? (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {event.entries_count} entradas no payload
                          </p>
                        ) : null}
                      </td>
                      <td className="px-2 py-3">
                        <PostLink event={event} />
                      </td>
                      <td className="px-2 py-3">
                        <CommentLink event={event} />
                      </td>
                      <td className="px-2 py-3">
                        <WebhookEventDetails
                          event={event}
                          open={expandedId === event.id}
                          onToggle={() =>
                            setExpandedId((current) => (current === event.id ? null : event.id))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 lg:hidden">
              {filtered.map((event) => (
                <WebhookEventMobileCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
