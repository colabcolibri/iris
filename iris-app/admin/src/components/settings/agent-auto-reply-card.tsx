import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAppSettings } from "@/contexts/app-settings-context";

export function AgentAutoReplyCard() {
  const { autoReplyEnabled, loading, saveAutoReplyEnabled } = useAppSettings();
  const [saving, setSaving] = useState(false);

  async function handleToggle(next: boolean) {
    setSaving(true);
    try {
      await saveAutoReplyEnabled(next);
      toast.success(
        next
          ? "Respostas automáticas do agente ativadas."
          : "Respostas automáticas do agente desativadas.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-4 border-border/80 bg-card/90 p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-sm font-semibold">Agente de comentários</h2>
        <p className="text-xs text-muted-foreground">
          Interruptor global para respostas automáticas da IA. Quando desligado, nenhum post recebe
          resposta automática ou rascunho gerado pelo worker — mesmo com modo ativo no post.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <label className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/30 p-4">
          <input
            type="checkbox"
            checked={autoReplyEnabled}
            disabled={saving}
            onChange={(e) => void handleToggle(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-input"
          />
          <span className="space-y-1">
            <Label className="text-sm font-medium leading-none">
              Respostas automáticas ativas
            </Label>
            <span className="block text-xs text-muted-foreground">
              Desmarque para pausar o agente em toda a conta. Configurações por post continuam salvas.
            </span>
          </span>
        </label>
      )}
    </Card>
  );
}
