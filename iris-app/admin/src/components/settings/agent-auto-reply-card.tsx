import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsCardShell } from "@/components/templates/settings-card-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReplyModeSelect } from "@/components/posts/reply-mode-select";
import { useAppSettings } from "@/contexts/app-settings-context";
import { interpolate } from "@/i18n/compose";
import { getGlobalReplyModeOptions } from "@/i18n/domains/labels/helpers";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ReplyMode } from "@/lib/types";

const TICK_PRESETS = [
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "20 min", seconds: 1200 },
] as const;

const DEBOUNCE_PRESETS = [
  { label: "30s", seconds: 30 },
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "3 min", seconds: 180 },
] as const;

const DEBOUNCE_MIN_SECONDS = 30;
const DEBOUNCE_MAX_SECONDS = 180;
const DEBOUNCE_DEFAULT_SECONDS = 30;

const MAX_AGE_PRESETS = [
  { label: "7 dias", days: 7 },
  { label: "15 dias", days: 15 },
  { label: "30 dias", days: 30 },
] as const;

const MAX_AGE_MIN_DAYS = 1;
const MAX_AGE_MAX_DAYS = 365;
const MAX_AGE_DEFAULT_DAYS = 15;

function formatDebounceLabel(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  return `${Math.round(seconds / 60)} min`;
}

function formatTickMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

type AgentAutoReplyCardProps = {
  embedded?: boolean;
};

export function AgentAutoReplyCard({ embedded = false }: AgentAutoReplyCardProps) {
  const { locale } = useAppLocale();
  const settings = useDomainMessages("settings");
  const t = settings.commentAgent;
  const {
    replyMode,
    replyDelaySeconds,
    replyMaxAgeDays,
    agentReplyTickIntervalSeconds,
    loading,
    saveReplyMode,
    saveReplyDelaySeconds,
    saveReplyMaxAgeDays,
    saveAgentReplyTickIntervalSeconds,
  } = useAppSettings();
  const [saving, setSaving] = useState(false);
  const [savingDebounce, setSavingDebounce] = useState(false);
  const [savingMaxAge, setSavingMaxAge] = useState(false);
  const [savingTick, setSavingTick] = useState(false);
  const [debounceInput, setDebounceInput] = useState(String(DEBOUNCE_DEFAULT_SECONDS));
  const [maxAgeInput, setMaxAgeInput] = useState(String(MAX_AGE_DEFAULT_DAYS));

  useEffect(() => {
    setDebounceInput(String(replyDelaySeconds || DEBOUNCE_DEFAULT_SECONDS));
  }, [replyDelaySeconds]);

  useEffect(() => {
    setMaxAgeInput(String(replyMaxAgeDays || MAX_AGE_DEFAULT_DAYS));
  }, [replyMaxAgeDays]);

  const tickMinutes = formatTickMinutes(agentReplyTickIntervalSeconds || 300);
  const debounceSeconds = replyDelaySeconds || DEBOUNCE_DEFAULT_SECONDS;
  const debounceLabel = formatDebounceLabel(debounceSeconds);

  const replyDebounceHint = interpolate(t.replyDebounceHint, {
    debounce: debounceLabel,
    tick: tickMinutes,
  });

  async function handleChange(next: ReplyMode) {
    setSaving(true);
    try {
      await saveReplyMode(next);
      const modeLabel =
        getGlobalReplyModeOptions(locale).find((option) => option.value === next)
          ?.label ?? next;
      toast.success(
        interpolate(t.toasts.modeUpdated, { mode: modeLabel.toLowerCase() }),
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  const persistDebounce = useCallback(
    async (rawSeconds: string) => {
      setSavingDebounce(true);
      try {
        const seconds = Math.min(
          DEBOUNCE_MAX_SECONDS,
          Math.max(
            DEBOUNCE_MIN_SECONDS,
            Number.parseInt(rawSeconds, 10) || DEBOUNCE_DEFAULT_SECONDS,
          ),
        );
        await saveReplyDelaySeconds(seconds);
        toast.success(interpolate(t.toasts.debounceUpdated, { debounce: formatDebounceLabel(seconds) }));
      } catch (err) {
        toast.error(getApiErrorMessage(err, locale) || t.toasts.debounceFailed);
      } finally {
        setSavingDebounce(false);
      }
    },
    [locale, saveReplyDelaySeconds, t.toasts],
  );

  async function persistMaxAgeDays(rawDays: string) {
    setSavingMaxAge(true);
    try {
      const days = Math.min(
        MAX_AGE_MAX_DAYS,
        Math.max(
          MAX_AGE_MIN_DAYS,
          Number.parseInt(rawDays, 10) || MAX_AGE_DEFAULT_DAYS,
        ),
      );
      await saveReplyMaxAgeDays(days);
      toast.success(interpolate(t.toasts.maxAgeUpdated, { days }));
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.maxAgeFailed);
    } finally {
      setSavingMaxAge(false);
    }
  }

  async function persistTickInterval(seconds: number) {
    setSavingTick(true);
    try {
      await saveAgentReplyTickIntervalSeconds(seconds);
      toast.success(
        interpolate(t.toasts.workerInterval, {
          minutes: Math.round(seconds / 60),
        }),
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.intervalFailed);
    } finally {
      setSavingTick(false);
    }
  }

  return (
    <SettingsCardShell embedded={embedded} title={t.title} description={t.description}>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t.loading}</p>
      ) : (
        <div className="max-w-xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="global-reply-mode" className="text-sm font-semibold">
              {t.globalModeLabel}
            </Label>
            <ReplyModeSelect
              id="global-reply-mode"
              variant="global"
              value={replyMode}
              onChange={(value) => void handleChange(value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">{t.maxAgeLabel}</Label>
              <p className="text-sm text-muted-foreground">{t.maxAgeHint}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {MAX_AGE_PRESETS.map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  disabled={savingMaxAge}
                  onClick={() => {
                    setMaxAgeInput(String(preset.days));
                    void persistMaxAgeDays(String(preset.days));
                  }}
                  className={`rounded-md border px-3 py-1.5 text-xs ${
                    replyMaxAgeDays === preset.days
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reply-max-age-days" className="text-sm font-semibold">
                {interpolate(t.maxAgeDaysLabel, {
                  min: MAX_AGE_MIN_DAYS,
                  max: MAX_AGE_MAX_DAYS,
                })}
              </Label>
              <Input
                id="reply-max-age-days"
                type="number"
                min={MAX_AGE_MIN_DAYS}
                max={MAX_AGE_MAX_DAYS}
                step={1}
                value={maxAgeInput}
                disabled={savingMaxAge}
                onChange={(event) => setMaxAgeInput(event.target.value)}
                onBlur={() => void persistMaxAgeDays(maxAgeInput)}
                className="max-w-[10rem]"
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">{t.workerIntervalLabel}</Label>
              <p className="text-sm text-muted-foreground">{t.workerIntervalHint}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {TICK_PRESETS.map((preset) => (
                <button
                  key={preset.seconds}
                  type="button"
                  disabled={savingTick}
                  onClick={() => void persistTickInterval(preset.seconds)}
                  className={`rounded-md border px-3 py-1.5 text-xs ${
                    agentReplyTickIntervalSeconds === preset.seconds
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">{t.replyDebounceLabel}</Label>
              <p className="text-sm text-muted-foreground">{replyDebounceHint}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {DEBOUNCE_PRESETS.map((preset) => (
                <button
                  key={preset.seconds}
                  type="button"
                  disabled={savingDebounce}
                  onClick={() => {
                    setDebounceInput(String(preset.seconds));
                    void persistDebounce(String(preset.seconds));
                  }}
                  className={`rounded-md border px-3 py-1.5 text-xs ${
                    debounceSeconds === preset.seconds
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reply-debounce-seconds" className="text-sm font-semibold">
                {interpolate(t.debounceSecondsLabel, {
                  min: DEBOUNCE_MIN_SECONDS,
                  max: DEBOUNCE_MAX_SECONDS,
                })}
              </Label>
              <Input
                id="reply-debounce-seconds"
                type="number"
                min={DEBOUNCE_MIN_SECONDS}
                max={DEBOUNCE_MAX_SECONDS}
                step={1}
                value={debounceInput}
                disabled={savingDebounce}
                onChange={(event) => setDebounceInput(event.target.value)}
                onBlur={() => void persistDebounce(debounceInput)}
                className="max-w-[10rem]"
              />
            </div>
          </div>
        </div>
      )}
    </SettingsCardShell>
  );
}
