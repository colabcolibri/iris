import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsCardShell } from "@/components/templates/settings-card-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReplyModeSelect } from "@/components/posts/reply-mode-select";
import { useAppSettings } from "@/contexts/app-settings-context";
import { replyModeOption } from "@/lib/reply-mode-options";
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

  async function handleChange(next: ReplyMode) {
    setSaving(true);
    try {
      await saveMessageReplyMode(next);
      toast.success(
        `Modo global de DM: ${replyModeOption(next).label.toLowerCase()}.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
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
            ? `Fila DM ativa: resposta após ${minutes} min.`
            : "Resposta imediata no próximo ciclo do agente de DM.",
        );
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Falha ao salvar delay.",
        );
      } finally {
        setSavingDelay(false);
      }
    },
    [saveMessageReplyDelaySeconds],
  );

  return (
    <SettingsCardShell
      embedded={embedded}
      title="Agente de mensagens (DM)"
      description="Modo padrão para conversas que seguem a configuração global. Conversas com modo próprio têm precedência."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="max-w-xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="message-global-reply-mode" className="text-sm font-semibold">
              Modo global
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
            <Label className="text-sm font-semibold">Intervalo do worker</Label>
            <p className="text-sm text-muted-foreground">
              Compartilhado com comentários — configurado no card do agente de
              comentários. Ciclo atual: <strong>{tickMinutes} min</strong>.
            </p>
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Tempo antes de responder</Label>
              <p className="text-sm text-muted-foreground">
                Mesma fila persistente usada nos comentários, com settings próprios
                para DM.
                {delayMinutes > 0 ? (
                  <>
                    {" "}
                    Cadência real: resposta após {delayMinutes} min + até{" "}
                    {tickMinutes} min até o próximo ciclo.
                  </>
                ) : (
                  <>
                    {" "}
                    Cadência real: até {tickMinutes} min até o próximo ciclo.
                  </>
                )}
              </p>
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
                Resposta imediata
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
                Fila com delay
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
                    Minutos de espera ({DELAY_MIN_MINUTES}–{DELAY_MAX_MINUTES})
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
