import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsCardShell } from "@/components/templates/settings-card-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppSettings } from "@/contexts/app-settings-context";
import { interpolate } from "@/i18n/compose";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";

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
  const { locale } = useAppLocale();
  const t = useDomainMessages("settings").autoMonitor;
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
      toast.success(next ? t.toasts.enabled : t.toasts.disabled);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.failed);
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
      toast.success(
        interpolate(t.toasts.intervalSaved, {
          minutes: Math.round(seconds / 60),
        }),
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.intervalFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsCardShell embedded={embedded} title={t.title} description={t.description}>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t.loading}</p>
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
              {t.onLabel}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="auto-monitor-enabled"
                checked={!autoMonitorEnabled}
                disabled={saving}
                onChange={() => void persistEnabled(false)}
              />
              {t.offLabel}
            </label>
          </div>

          {autoMonitorEnabled ? (
            <div className="space-y-3 border-t border-border/60 pt-4">
              <div className="space-y-1">
                <Label className="text-sm font-semibold">{t.pollIntervalLabel}</Label>
                <p className="text-sm text-muted-foreground">{t.pollIntervalHint}</p>
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
                <Label htmlFor="auto-monitor-interval" className="text-sm font-semibold">
                  {interpolate(t.secondsLabel, {
                    min: INTERVAL_MIN,
                    max: INTERVAL_MAX,
                  })}
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
