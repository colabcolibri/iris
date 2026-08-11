import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReplyModeSelect } from "@/components/posts/reply-mode-select";
import { useAppSettings } from "@/contexts/app-settings-context";
import { replyModeOption } from "@/lib/reply-mode-options";
import type { ReplyMode } from "@/lib/types";

const DELAY_MIN = 30;
const DELAY_MAX = 600;
const DELAY_SUGGESTED = 90;

export function AgentAutoReplyCard() {
  const { replyMode, replyDelaySeconds, loading, saveReplyMode, saveReplyDelaySeconds } =
    useAppSettings();
  const [saving, setSaving] = useState(false);
  const [savingDelay, setSavingDelay] = useState(false);
  const [delayEnabled, setDelayEnabled] = useState(false);
  const [delayInput, setDelayInput] = useState(String(DELAY_SUGGESTED));

  useEffect(() => {
    setDelayEnabled(replyDelaySeconds > 0);
    if (replyDelaySeconds > 0) {
      setDelayInput(String(replyDelaySeconds));
    }
  }, [replyDelaySeconds]);

  async function handleChange(next: ReplyMode) {
    setSaving(true);
    try {
      await saveReplyMode(next);
      toast.success(`Modo global do agente: ${replyModeOption(next).label.toLowerCase()}.`);
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
          ? Math.min(DELAY_MAX, Math.max(DELAY_MIN, Number.parseInt(rawSeconds, 10) || DELAY_SUGGESTED))
          : 0;
        await saveReplyDelaySeconds(seconds);
        toast.success(
          seconds > 0
            ? `Fila ativa: resposta após ${seconds}s.`
            : "Resposta imediata no próximo ciclo do agente.",
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha ao salvar delay.");
      } finally {
        setSavingDelay(false);
      }
    },
    [saveReplyDelaySeconds],
  );

  return (
    <Card className="space-y-4 border-border bg-card p-6 shadow-none">
      <header className="space-y-1">
        <h2 className="text-sm font-semibold">Agente de comentários</h2>
        <p className="text-xs text-muted-foreground">
          Modo padrão para posts que seguem a configuração global. Posts com modo próprio têm
          precedência.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="max-w-xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="global-reply-mode" className="text-sm font-semibold">
              Modo global
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
              <Label className="text-sm font-semibold">Tempo antes de responder</Label>
              <p className="text-xs text-muted-foreground">
                Padrão: imediato. Com fila, o agente aguarda o intervalo (sugestão 60–120s) antes
                do harness — a fila fica no banco e sobrevive a reinícios.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="reply-delay-mode"
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
                  name="reply-delay-mode"
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
                <Label htmlFor="reply-delay-seconds" className="text-sm font-semibold">
                  Segundos de espera ({DELAY_MIN}–{DELAY_MAX})
                </Label>
                <Input
                  id="reply-delay-seconds"
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
    </Card>
  );
}
