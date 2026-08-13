import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsCardShell } from "@/components/templates/settings-card-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppSettings } from "@/contexts/app-settings-context";

const INTERVAL_MIN = 60;
const INTERVAL_MAX = 3600;
const INTERVAL_DEFAULT = 300;

const PRESETS = [
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
] as const;

type AutoMonitorCardProps = {
  embedded?: boolean;
};

export function AutoMonitorCard({ embedded = false }: AutoMonitorCardProps) {
  const {
    autoMonitorEnabled,
    autoMonitorIntervalSeconds,
    loading,
    saveAutoMonitorEnabled,
    saveAutoMonitorIntervalSeconds,
  } = useAppSettings();
  const [saving, setSaving] = useState(false);
  const [intervalInput, setIntervalInput] = useState(String(INTERVAL_DEFAULT));

  useEffect(() => {
    setIntervalInput(String(autoMonitorIntervalSeconds || INTERVAL_DEFAULT));
  }, [autoMonitorIntervalSeconds]);

  async function persistEnabled(next: boolean) {
    setSaving(true);
    try {
      await saveAutoMonitorEnabled(next);
      toast.success(
        next
          ? "Auto-monitoramento ligado — publicações novas entram sozinhas."
          : "Auto-monitoramento desligado — só cadastro manual ou publish Iris.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function persistInterval(raw: string) {
    const parsed = Number.parseInt(raw, 10);
    const seconds = Number.isFinite(parsed)
      ? Math.min(INTERVAL_MAX, Math.max(INTERVAL_MIN, parsed))
      : INTERVAL_DEFAULT;
    setSaving(true);
    try {
      await saveAutoMonitorIntervalSeconds(seconds);
      setIntervalInput(String(seconds));
      toast.success(`Intervalo do poll: ${Math.round(seconds / 60)} min.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao salvar intervalo.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsCardShell
      embedded={embedded}
      title="Auto-monitoramento de publicações"
      description="Descobre mídias novas no Instagram (poll) e cadastra posts monitorados. Também cadastra no primeiro comentário via webhook se a mídia ainda não existir."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="max-w-xl space-y-6">
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="auto-monitor-enabled"
                checked={autoMonitorEnabled}
                disabled={saving}
                onChange={() => void persistEnabled(true)}
              />
              Ligado
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="auto-monitor-enabled"
                checked={!autoMonitorEnabled}
                disabled={saving}
                onChange={() => void persistEnabled(false)}
              />
              Desligado
            </label>
          </div>

          {autoMonitorEnabled ? (
            <div className="space-y-3 border-t border-border/60 pt-4">
              <div className="space-y-1">
                <Label className="text-sm font-semibold">
                  Intervalo do poll
                </Label>
                <p className="text-sm text-muted-foreground">
                  Padrão: 5 minutos. A Meta não avisa post novo por webhook — o
                  Iris consulta a lista recente neste intervalo.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.seconds}
                    type="button"
                    disabled={saving}
                    onClick={() => void persistInterval(String(preset.seconds))}
                    className={`rounded-md border px-3 py-1.5 text-xs ${
                      autoMonitorIntervalSeconds === preset.seconds
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="auto-monitor-interval"
                  className="text-sm font-semibold"
                >
                  Segundos ({INTERVAL_MIN}–{INTERVAL_MAX})
                </Label>
                <Input
                  id="auto-monitor-interval"
                  type="number"
                  min={INTERVAL_MIN}
                  max={INTERVAL_MAX}
                  step={60}
                  value={intervalInput}
                  disabled={saving}
                  onChange={(event) => setIntervalInput(event.target.value)}
                  onBlur={() => void persistInterval(intervalInput)}
                  className="max-w-[10rem]"
                />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </SettingsCardShell>
  );
}
