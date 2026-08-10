import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ReplyAuditTimeline } from "@/components/comments/reply-audit-timeline";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/templates/page-container";
import { fetchAgentRunDetail, fetchAgentRuns, fetchReplyPersona } from "@/lib/api";
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
  const [items, setItems] = useState<AgentRunListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminalFilter, setTerminalFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AgentRunDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [responseLanguage, setResponseLanguage] = useState<string | null>(null);

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
      toast.error(err instanceof Error ? err.message : "Falha ao carregar execuções.");
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
        toast.error(err instanceof Error ? err.message : "Falha ao carregar detalhe.");
        setDetail(null);
      })
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const rows = useMemo(() => items, [items]);
  const languageLabel =
    RESPONSE_LANGUAGE_OPTIONS.find((option) => option.code === responseLanguage)?.label ??
    responseLanguage;

  return (
    <PageContainer variant="fill">
      <PageContainer.Content width="full">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card lg:flex-row">
          <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-border lg:w-[min(100%,520px)] lg:max-w-[520px] lg:border-b-0 lg:border-r">
            <div className="shrink-0 border-b border-border p-4 sm:px-5">
              <PageContainer.Header
                eyebrow="Operação"
                title="Execuções do agente"
                description="Monitoramento global das runs de auto-resposta."
              />
              {responseLanguage ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Idioma configurado na persona:{" "}
                  <span className="font-medium text-foreground">{languageLabel}</span>
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
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
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
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
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              {loading && rows.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">Carregando…</p>
              ) : rows.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">Nenhuma execução encontrada.</p>
              ) : (
                <table className="w-full min-w-[480px] border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-b border-border/70 text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Quando</th>
                      <th className="px-3 py-2 font-medium">Origem</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Tier</th>
                      <th className="px-3 py-2 font-medium">Tokens</th>
                      <th className="px-3 py-2 font-medium">Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "cursor-pointer border-b border-border/50 align-top hover:bg-muted/30",
                          selectedId === row.id && "bg-muted/40",
                        )}
                        onClick={() => setSelectedId(row.id)}
                      >
                        <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                          {new Date(row.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{row.trigger}</td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                              terminalBadgeClass(row.terminal_status),
                            )}
                          >
                            {TERMINAL_LABELS[row.terminal_status ?? ""] ?? row.terminal_status ?? "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3">{row.reply_tier ?? "—"}</td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {row.total_tokens != null
                            ? `${row.total_tokens} (${row.total_prompt_tokens ?? 0} in / ${row.total_completion_tokens ?? 0} out)`
                            : "—"}
                        </td>
                        <td className="px-3 py-3">{formatDuration(row.duration_ms)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
              <h2 className="text-sm font-semibold">Detalhe da execução</h2>
              {selectedId && detail ? (
                <p className="mt-1 text-[11px] font-mono text-muted-foreground">
                  flow {detail.audit.flow_id}
                </p>
              ) : null}
              {selectedId && detail?.comment_id ? (
                <Link
                  to={`/comments?comment=${detail.comment_id}`}
                  className="text-xs text-primary hover:underline"
                >
                  abrir thread do comentário
                </Link>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
              {!selectedId ? (
                <p className="text-sm text-muted-foreground">Selecione uma execução na lista.</p>
              ) : detailLoading ? (
                <p className="text-sm text-muted-foreground">Carregando detalhe…</p>
              ) : detail?.audit ? (
                <ReplyAuditTimeline audit={detail.audit} />
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados de auditoria.</p>
              )}
            </div>
          </section>
        </div>
      </PageContainer.Content>
    </PageContainer>
  );
}
