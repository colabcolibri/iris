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
import {
  clampDebounceMinutes,
  DEBOUNCE_DEFAULT_MINUTES,
  DEBOUNCE_MAX_MINUTES,
  DEBOUNCE_MIN_MINUTES,
  DEBOUNCE_PRESET_MINUTES,
  debounceSecondsToMinutes,
  formatDebounceMinutesLabel,
  minutesToDebounceSeconds,
} from "@/lib/agent-reply-debounce-settings";
import type { ReplyMode } from "@/lib/types";

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
  const [debounceInput, setDebounceInput] = useState(String(DEBOUNCE_DEFAULT_MINUTES));

  const debounceMinutes = debounceSecondsToMinutes(messageReplyDelaySeconds);

  useEffect(() => {
    setDebounceInput(String(debounceMinutes));
  }, [debounceMinutes]);

  const tickMinutes = Math.round((agentReplyTickIntervalSeconds || 300) / 60);
  const debounceLabel = formatDebounceMinutesLabel(debounceMinutes);

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
    async (rawMinutes: string) => {
      setSavingDebounce(true);
      try {
        const minutes = clampDebounceMinutes(Number.parseInt(rawMinutes, 10));
        await saveMessageReplyDelaySeconds(minutesToDebounceSeconds(minutes));
        toast.success(
          interpolate(t.toasts.debounceUpdated, {
            debounce: formatDebounceMinutesLabel(minutes),
          }),
        );
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
              {DEBOUNCE_PRESET_MINUTES.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  disabled={savingDebounce}
                  onClick={() => {
                    setDebounceInput(String(minutes));
                    void persistDebounce(String(minutes));
                  }}
                  className={`rounded-md border px-3 py-1.5 text-xs ${
                    debounceMinutes === minutes
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  {formatDebounceMinutesLabel(minutes)}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="message-reply-debounce-minutes"
                className="text-sm font-semibold"
              >
                {interpolate(t.debounceMinutesLabel, {
                  min: DEBOUNCE_MIN_MINUTES,
                  max: DEBOUNCE_MAX_MINUTES,
                })}
              </Label>
              <Input
                id="message-reply-debounce-minutes"
                type="number"
                min={DEBOUNCE_MIN_MINUTES}
                max={DEBOUNCE_MAX_MINUTES}
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
