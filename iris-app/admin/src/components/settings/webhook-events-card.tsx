import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchWebhookEvents } from "@/lib/api";
import type { WebhookEvent } from "@/lib/types";

const STATUS_LABELS: Record<WebhookEvent["processing_status"], string> = {
  received: "recebido",
  processed: "processado",
  ignored: "ignorado",
  failed: "falhou",
};

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

export function WebhookEventsCard() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWebhookEvents(30);
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

  return (
    <Card className="space-y-5 border-border/80 bg-card/90 p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Webhooks Meta (auditoria)</h2>
          <p className="text-xs text-muted-foreground">
            Últimos eventos recebidos do Instagram. Útil para ver se um comentário foi processado ou
            ignorado.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </header>

      {loading && events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum webhook registrado ainda.</p>
      ) : (
        <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-lg border border-border/70 bg-background/60 px-3 py-2.5 text-xs"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${statusClass(event.processing_status)}`}
                >
                  {STATUS_LABELS[event.processing_status]}
                </span>
                {!event.signature_valid ? (
                  <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                    assinatura inválida
                  </span>
                ) : null}
                <span className="text-muted-foreground">
                  {new Date(event.received_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                {event.object ?? "—"} · {event.field ?? "—"}
                {event.post_id ? ` · post ${event.post_id.slice(0, 8)}…` : ""}
                {event.comment_id ? ` · coment. ${event.comment_id.slice(0, 8)}…` : ""}
              </p>
              {event.error_message ? (
                <p className="mt-1 text-destructive">{event.error_message}</p>
              ) : null}
              <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/40 p-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
                {event.payload_json}
                {event.payload_truncated ? "\n… (truncado)" : ""}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
