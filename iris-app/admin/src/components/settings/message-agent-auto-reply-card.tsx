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

const DEBOUNCE_PRESETS = [
  { label: "30s", seconds: 30 },
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "3 min", seconds: 180 },
] as const;

const DEBOUNCE_MIN_SECONDS = 30;
const DEBOUNCE_MAX_SECONDS = 180;
const DEBOUNCE_DEFAULT_SECONDS = 30;

function formatDebounceLabel(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  return `${Math.round(seconds / 60)} min`;
}

type MessageAgentAutoReplyCardProps = {
  embedded?: boolean;
};

export function MessageAgentAutoReplyCard({
  embedded = false,
}: MessageAgentAutoReplyCardProps) {
  const { locale } = useAppLocale();
  const settings = useDomainMessages("settings");
  const t = settings.messageAgent;
  const {
    messageReplyMode,
    messageReplyDelaySeconds,
    agentReplyTickIntervalSeconds,
    loading,
    saveMessageReplyMode,
    saveMessageReplyDelaySeconds,
  } = useAppSettings();
  const [saving, setSaving] = useState(false);
  const [savingDebounce, setSavingDebounce] = useState(false);
  const [debounceInput, setDebounceInput] = useState(String(DEBOUNCE_DEFAULT_SECONDS));

  useEffect(() => {
    setDebounceInput(String(messageReplyDelaySeconds || DEBOUNCE_DEFAULT_SECONDS));
  }, [messageReplyDelaySeconds]);

  const tickMinutes = Math.round((agentReplyTickIntervalSeconds || 300) / 60);
  const debounceSeconds = messageReplyDelaySeconds || DEBOUNCE_DEFAULT_SECONDS;
  const debounceLabel = formatDebounceLabel(debounceSeconds);

  const replyDebounceHint = interpolate(t.replyDebounceHint, {
    debounce: debounceLabel,
    tick: tickMinutes,
  });

  async function handleChange(next: ReplyMode) {
    setSaving(true);
    try {
      await saveMessageReplyMode(next);
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
        await saveMessageReplyDelaySeconds(seconds);
        toast.success(interpolate(t.toasts.debounceUpdated, { debounce: formatDebounceLabel(seconds) }));
      } catch (err) {
        toast.error(getApiErrorMessage(err, locale) || t.toasts.debounceFailed);
      } finally {
        setSavingDebounce(false);
      }
    },
    [locale, saveMessageReplyDelaySeconds, t.toasts],
  );

  return (
    <SettingsCardShell embedded={embedded} title={t.title} description={t.description}>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t.loading}</p>
      ) : (
        <div className="max-w-xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="message-global-reply-mode" className="text-sm font-semibold">
              {t.globalModeLabel}
            </Label>
            <ReplyModeSelect
              id="message-global-reply-mode"
              variant="global"
              value={messageReplyMode}
              onChange={(value) => void handleChange(value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2 border-t border-border/60 pt-4">
            <Label className="text-sm font-semibold">{t.workerIntervalLabel}</Label>
            <p className="text-sm text-muted-foreground">
              {interpolate(t.workerIntervalHint, { minutes: tickMinutes })}
            </p>
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
              <Label
                htmlFor="message-reply-debounce-seconds"
                className="text-sm font-semibold"
              >
                {interpolate(t.debounceSecondsLabel, {
                  min: DEBOUNCE_MIN_SECONDS,
                  max: DEBOUNCE_MAX_SECONDS,
                })}
              </Label>
              <Input
                id="message-reply-debounce-seconds"
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
