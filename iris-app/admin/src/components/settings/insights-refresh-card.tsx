import { useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SettingsCardShell } from "@/components/templates/settings-card-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { refreshAllPostInsights } from "@/lib/api";
import { useMetaSession } from "@/contexts/meta-session-context";

function startOfDayIso(dateYmd: string): string {
  return `${dateYmd}T00:00:00.000Z`;
}

function endOfDayIso(dateYmd: string): string {
  return `${dateYmd}T23:59:59.999Z`;
}

type InsightsRefreshCardProps = {
  embedded?: boolean;
};

export function InsightsRefreshCard({
  embedded = false,
}: InsightsRefreshCardProps) {
  const { meta } = useMetaSession();
  const metaReady = Boolean(meta?.connected);
  const [sinceDate, setSinceDate] = useState("");
  const [untilDate, setUntilDate] = useState("");
  const [running, setRunning] = useState(false);

  const rangeHint = useMemo(() => {
    if (!sinceDate && !untilDate) {
      return "Sem datas: atualiza todos os posts published/monitored com mídia IG.";
    }
    const parts: string[] = [];
    if (sinceDate) parts.push(`de ${sinceDate}`);
    if (untilDate) parts.push(`até ${untilDate}`);
    return `Janela por data de publicação (UTC): ${parts.join(" ")}.`;
  }, [sinceDate, untilDate]);

  async function handleRefresh() {
    if (sinceDate && untilDate && sinceDate > untilDate) {
      toast.error("A data inicial não pode ser depois da final.");
      return;
    }

    setRunning(true);
    try {
      const result = await refreshAllPostInsights({
        force: true,
        delay_ms: 750,
        since: sinceDate ? startOfDayIso(sinceDate) : undefined,
        until: untilDate ? endOfDayIso(untilDate) : undefined,
      });
      const failCount = result.failed.length;
      const skipCount = result.skipped.length;
      toast.success(
        `Insights: ${result.refreshed.length}/${result.requested} atualizados` +
          (failCount ? ` · ${failCount} falha(s)` : "") +
          (skipCount ? ` · ${skipCount} fora do limite` : "") +
          ".",
      );
      if (failCount > 0) {
        toast.message(
          result.failed
            .slice(0, 3)
            .map((item) => `${item.post_id}: ${item.error}`)
            .join(" · "),
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao atualizar insights.",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <SettingsCardShell
      embedded={embedded}
      title="Insights Instagram em lote"
      description="Atualiza métricas dos posts já publicados ou monitorados. Opcionalmente filtra pela data de publicação (published_at)."
    >
      {!metaReady ? (
        <p className="text-sm text-muted-foreground">
          Conecte o Instagram para atualizar insights.
        </p>
      ) : (
        <div className="max-w-xl space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="insights-since" className="text-sm font-semibold">
                Publicado desde
              </Label>
              <Input
                id="insights-since"
                type="date"
                value={sinceDate}
                onChange={(event) => setSinceDate(event.target.value)}
                disabled={running}
                className="rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insights-until" className="text-sm font-semibold">
                Publicado até
              </Label>
              <Input
                id="insights-until"
                type="date"
                value={untilDate}
                onChange={(event) => setUntilDate(event.target.value)}
                disabled={running}
                className="rounded-md"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{rangeHint}</p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={running}
            >
              {running ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="size-4" aria-hidden />
              )}
              {running ? "Atualizando…" : "Atualizar insights"}
            </Button>
            {(sinceDate || untilDate) && (
              <Button
                type="button"
                variant="ghost"
                disabled={running}
                onClick={() => {
                  setSinceDate("");
                  setUntilDate("");
                }}
              >
                Limpar datas
              </Button>
            )}
          </div>
        </div>
      )}
    </SettingsCardShell>
  );
}
