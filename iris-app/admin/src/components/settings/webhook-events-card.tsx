import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchWebhookEvents } from "@/lib/api";
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

function payloadPreview(payload: string): string {
  const oneLine = payload.replace(/\s+/g, " ").trim();
  return oneLine.length > 120 ? `${oneLine.slice(0, 119)}…` : oneLine;
}

function StatusBadges({ event }: { event: WebhookEvent }) {
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
      {!event.signature_valid ? (
        <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
          assinatura inválida
        </span>
      ) : null}
    </div>
  );
}

function EntityLinks({ event }: { event: WebhookEvent }) {
  return (
    <div className="flex flex-col gap-0.5">
      {event.post_id ? (
        <Link to={`/comments?post_id=${event.post_id}`} className="text-primary hover:underline">
          post {truncateId(event.post_id)}
        </Link>
      ) : (
        <span>post —</span>
      )}
      {event.comment_id ? (
        <Link
          to={`/comments?post_id=${event.post_id ?? ""}&comment=${event.comment_id}`}
          className="text-primary hover:underline"
        >
          coment. {truncateId(event.comment_id)}
        </Link>
      ) : (
        <span>coment. —</span>
      )}
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
      <p className="font-mono text-[11px] text-muted-foreground">{payloadPreview(event.payload_json)}</p>
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
          {event.payload_truncated ? "\n… (truncado)" : ""}
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
      <p className="mt-2 text-muted-foreground">{event.field ?? "—"}</p>
      <div className="mt-1">
        <EntityLinks event={event} />
      </div>
      <div className="mt-2">
        <WebhookEventDetails event={event} open={open} onToggle={() => setOpen((v) => !v)} />
      </div>
    </div>
  );
}

export function WebhookEventsPanel() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<WebhookProcessingStatus | "all">("all");
  const [invalidOnly, setInvalidOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWebhookEvents(100);
      setEvents(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar webhooks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return events.filter((event) => {
      if (statusFilter !== "all" && event.processing_status !== statusFilter) {
        return false;
      }
      if (invalidOnly && event.signature_valid) {
        return false;
      }
      return true;
    });
  }, [events, invalidOnly, statusFilter]);

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
          <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={invalidOnly}
              onChange={(event) => setInvalidOnly(event.target.checked)}
            />
            só assinatura inválida
          </label>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        {loading && events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum webhook encontrado com os filtros atuais.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/70 text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Recebido</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Field</th>
                    <th className="px-2 py-2 font-medium">Post / comentário</th>
                    <th className="px-2 py-2 font-medium">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => (
                    <tr key={event.id} className="border-b border-border/50 align-top">
                      <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(event.received_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-2 py-3">
                        <StatusBadges event={event} />
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">{event.field ?? "—"}</td>
                      <td className="px-2 py-3">
                        <EntityLinks event={event} />
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

            <div className="space-y-2 md:hidden">
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
