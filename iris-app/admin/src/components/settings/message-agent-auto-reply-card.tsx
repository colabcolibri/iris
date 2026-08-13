import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsCardShell } from "@/components/templates/settings-card-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReplyModeSelect } from "@/components/posts/reply-mode-select";
import { useAppSettings } from "@/contexts/app-settings-context";
import { replyModeOption } from "@/lib/reply-mode-options";
import type { ReplyMode } from "@/lib/types";

const DELAY_MIN = 30;
const DELAY_MAX = 600;
const DELAY_SUGGESTED = 90;

type MessageAgentAutoReplyCardProps = {
  embedded?: boolean;
};

export function MessageAgentAutoReplyCard({
  embedded = false,
}: MessageAgentAutoReplyCardProps) {
  const {
    messageReplyMode,
    messageReplyDelaySeconds,
    loading,
    saveMessageReplyMode,
    saveMessageReplyDelaySeconds,
  } = useAppSettings();
  const [saving, setSaving] = useState(false);
  const [savingDelay, setSavingDelay] = useState(false);
  const [delayEnabled, setDelayEnabled] = useState(false);
  const [delayInput, setDelayInput] = useState(String(DELAY_SUGGESTED));

  useEffect(() => {
    setDelayEnabled(messageReplyDelaySeconds > 0);
    if (messageReplyDelaySeconds > 0) {
      setDelayInput(String(messageReplyDelaySeconds));
    }
  }, [messageReplyDelaySeconds]);

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
    async (enabled: boolean, rawSeconds: string) => {
      setSavingDelay(true);
      try {
        const seconds = enabled
          ? Math.min(
              DELAY_MAX,
              Math.max(DELAY_MIN, Number.parseInt(rawSeconds, 10) || DELAY_SUGGESTED),
            )
          : 0;
        await saveMessageReplyDelaySeconds(seconds);
        toast.success(
          seconds > 0
            ? `Fila DM ativa: resposta após ${seconds}s.`
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

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Tempo antes de responder</Label>
              <p className="text-sm text-muted-foreground">
                Mesma fila persistente usada nos comentários, com settings próprios para DM.
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
              <div className="space-y-2">
                <Label htmlFor="message-reply-delay-seconds" className="text-sm font-semibold">
                  Segundos de espera ({DELAY_MIN}–{DELAY_MAX})
                </Label>
                <Input
                  id="message-reply-delay-seconds"
                  type="number"
                  min={DELAY_MIN}
                  max={DELAY_MAX}
                  step={15}
                  value={delayInput}
                  disabled={savingDelay}
                  onChange={(event) => setDelayInput(event.target.value)}
                  onBlur={() => void persistDelay(true, delayInput)}
                  className="max-w-[10rem]"
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </SettingsCardShell>
  );
}
