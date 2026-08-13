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

const DELAY_PRESETS = [
  { label: "1 min", minutes: 1 },
  { label: "2 min", minutes: 2 },
  { label: "3 min", minutes: 3 },
  { label: "5 min", minutes: 5 },
] as const;

const DELAY_MIN_MINUTES = 1;
const DELAY_MAX_MINUTES = 60;
const DELAY_SUGGESTED_MINUTES = 2;

function minutesFromDelaySeconds(seconds: number): number {
  if (seconds <= 0) {
    return 0;
  }
  return Math.max(DELAY_MIN_MINUTES, Math.round(seconds / 60));
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
  const [savingDelay, setSavingDelay] = useState(false);
  const [delayEnabled, setDelayEnabled] = useState(false);
  const [delayInput, setDelayInput] = useState(String(DELAY_SUGGESTED_MINUTES));

  useEffect(() => {
    setDelayEnabled(messageReplyDelaySeconds > 0);
    if (messageReplyDelaySeconds > 0) {
      setDelayInput(String(minutesFromDelaySeconds(messageReplyDelaySeconds)));
    }
  }, [messageReplyDelaySeconds]);

  const tickMinutes = Math.round((agentReplyTickIntervalSeconds || 300) / 60);
  const delayMinutes = delayEnabled
    ? minutesFromDelaySeconds(messageReplyDelaySeconds)
    : 0;

  const replyDelayHint =
    t.replyDelayHint +
    (delayMinutes > 0
      ? interpolate(t.replyDelayCadenceDelayed, {
          delay: delayMinutes,
          tick: tickMinutes,
        })
      : interpolate(t.replyDelayCadenceImmediate, { tick: tickMinutes }));

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

  const persistDelay = useCallback(
    async (enabled: boolean, rawMinutes: string) => {
      setSavingDelay(true);
      try {
        const minutes = enabled
          ? Math.min(
              DELAY_MAX_MINUTES,
              Math.max(
                DELAY_MIN_MINUTES,
                Number.parseInt(rawMinutes, 10) || DELAY_SUGGESTED_MINUTES,
              ),
            )
          : 0;
        await saveMessageReplyDelaySeconds(minutes * 60);
        toast.success(
          minutes > 0
            ? interpolate(t.toasts.delayQueued, { minutes })
            : t.toasts.delayImmediate,
        );
      } catch (err) {
        toast.error(getApiErrorMessage(err, locale) || t.toasts.delayFailed);
      } finally {
        setSavingDelay(false);
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
              <Label className="text-sm font-semibold">{t.replyDelayLabel}</Label>
              <p className="text-sm text-muted-foreground">{replyDelayHint}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="message-reply-delay-mode"
                  checked={!delayEnabled}
                  disabled={savingDelay}
                  onChange={() => {
                    setDelayEnabled(false);
                    void persistDelay(false, delayInput);
                  }}
                />
                {t.delayImmediate}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="message-reply-delay-mode"
                  checked={delayEnabled}
                  disabled={savingDelay}
                  onChange={() => {
                    setDelayEnabled(true);
                    void persistDelay(true, delayInput);
                  }}
                />
                {t.delayQueued}
              </label>
            </div>

            {delayEnabled ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {DELAY_PRESETS.map((preset) => (
                    <button
                      key={preset.minutes}
                      type="button"
                      disabled={savingDelay}
                      onClick={() => {
                        setDelayInput(String(preset.minutes));
                        void persistDelay(true, String(preset.minutes));
                      }}
                      className={`rounded-md border px-3 py-1.5 text-xs ${
                        minutesFromDelaySeconds(messageReplyDelaySeconds) ===
                        preset.minutes
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
                    htmlFor="message-reply-delay-minutes"
                    className="text-sm font-semibold"
                  >
                    {interpolate(t.delayMinutesLabel, {
                      min: DELAY_MIN_MINUTES,
                      max: DELAY_MAX_MINUTES,
                    })}
                  </Label>
                  <Input
                    id="message-reply-delay-minutes"
                    type="number"
                    min={DELAY_MIN_MINUTES}
                    max={DELAY_MAX_MINUTES}
                    step={1}
                    value={delayInput}
                    disabled={savingDelay}
                    onChange={(event) => setDelayInput(event.target.value)}
                    onBlur={() => void persistDelay(true, delayInput)}
                    className="max-w-[10rem]"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </SettingsCardShell>
  );
}
